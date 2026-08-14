const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const MatchingRequest = require('../models/MatchingRequest');

class MatchingService {
  /**
   * Find an available interviewer for a matching request
   * @param {Object} request - The MatchingRequest document
   * @returns {Object} - The matched request or null
   */
  static async findInterviewerMatch(request) {
    try {
      const query = {
        _id: { $ne: request._id },
        userId: { $ne: request.userId },
        status: 'waiting',
        interviewType: request.interviewType,
        difficulty: request.difficulty,
        preferredLanguage: request.preferredLanguage,
        rolePreference: this.getOppositeRole(request.rolePreference),
      };

      // For scheduled interviews, ensure time slot matches
      if (request.type === 'scheduled') {
        query.type = 'scheduled';
        query.scheduledStartTime = request.scheduledStartTime;
        query.scheduledEndTime = request.scheduledEndTime;
      } else {
        query.type = 'instant';
      }

      console.log(`    Query for ${this.getOppositeRole(request.rolePreference)}: ${JSON.stringify(query)}`);
      const match = await MatchingRequest.findOne(query);
      console.log(`    Query result: ${match ? 'FOUND ' + match._id : 'NOT FOUND'}`);
      return match;
    } catch (err) {
      console.error('Error finding interviewer match:', err);
      return null;
    }
  }

  /**
   * Find a compatible candidate for peer-to-peer matching (fallback)
   * For peer matching, be more lenient - don't require exact difficulty match
   * @param {Object} request - The MatchingRequest document
   * @returns {Object} - The matched request or null
   */
  static async findCandidateMatch(request) {
    try {
      const query = {
        _id: { $ne: request._id },
        userId: { $ne: request.userId },
        status: 'waiting',
        matchedWith: { $exists: false },
        interviewType: request.interviewType,
        // Don't require exact difficulty match for peer matching
        preferredLanguage: request.preferredLanguage,
      };

      // For scheduled interviews, ensure time slot is compatible
      if (request.type === 'scheduled') {
        query.type = 'scheduled';
        query.scheduledStartTime = request.scheduledStartTime;
      } else {
        query.type = 'instant';
      }

      console.log(`    Query for candidate (lenient): ${JSON.stringify(query)}`);
      const match = await MatchingRequest.findOne(query);
      console.log(`    Query result: ${match ? 'FOUND ' + match._id + ' (difficulty: ' + match.difficulty + ')' : 'NOT FOUND'}`);
      return match;
    } catch (err) {
      console.error('Error finding candidate match:', err);
      return null;
    }
  }

  /**
   * Create a session for matched users
   * @param {Object} request1 - First MatchingRequest
   * @param {Object} request2 - Second MatchingRequest
   * @param {String} matchType - 'interviewer' or 'peer'
   * @returns {Object} - The created Session
   */
  static async createSessionForMatch(request1, request2, matchType) {
    try {
      let role1, role2;

      if (matchType === 'interviewer') {
        // One is candidate, one is interviewer
        role1 = request1.rolePreference === 'candidate' ? 'candidate' : 'interviewer';
        role2 = request1.rolePreference === 'candidate' ? 'interviewer' : 'candidate';
      } else {
        // Both are peers (candidates)
        role1 = 'candidate';
        role2 = 'candidate';
      }

      const session = await Session.create({
        participants: [
          { user: request1.userId, role: role1 },
          { user: request2.userId, role: role2 }
        ],
        language: request1.preferredLanguage
      });

      return session;
    } catch (err) {
      console.error('Error creating session:', err);
      throw err;
    }
  }

  /**
   * Match two requests and update their status atomically
   * @param {String} requestId1 - First request ID
   * @param {String} requestId2 - Second request ID
   * @param {String} matchType - 'interviewer' or 'peer'
   * @returns {Object} - { session, request1, request2 } or { error }
   */
  static async matchRequests(requestId1, requestId2, matchType) {
    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
      console.log(`    Creating match: ${requestId1} <-> ${requestId2} (type: ${matchType})`);
      
      // Fetch both requests
      const request1 = await MatchingRequest.findById(requestId1).session(session);
      const request2 = await MatchingRequest.findById(requestId2).session(session);

      if (!request1 || !request2) {
        throw new Error('One or both requests not found');
      }

      if (request1.status !== 'waiting' || request2.status !== 'waiting') {
        throw new Error('One or both requests are no longer waiting');
      }

      // Create session
      const createdSession = await this.createSessionForMatch(request1, request2, matchType);
      console.log(`    Session created: ${createdSession._id}`);

      // Update both requests atomically
      await MatchingRequest.updateOne(
        { _id: requestId1 },
        {
          status: 'matched',
          matchedWith: request2.userId,
          matchType: matchType,
          sessionId: createdSession._id
        },
        { session }
      );

      await MatchingRequest.updateOne(
        { _id: requestId2 },
        {
          status: 'matched',
          matchedWith: request1.userId,
          matchType: matchType,
          sessionId: createdSession._id
        },
        { session }
      );

      await session.commitTransaction();
      console.log(`    Match committed successfully`);

      return {
        session: createdSession,
        request1: await MatchingRequest.findById(requestId1),
        request2: await MatchingRequest.findById(requestId2)
      };
    } catch (err) {
      await session.abortTransaction();
      console.error('Error matching requests:', err);
      return { error: err.message };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Apply fallback to candidate-candidate matching for a scheduled request
   * @param {String} requestId - The request ID to apply fallback for
   * @returns {Object} - { success, result } or { error }
   */
  static async applyScheduledFallback(requestId) {
    try {
      const request = await MatchingRequest.findById(requestId);

      if (!request || request.status !== 'waiting' || request.type !== 'scheduled') {
        return { error: 'Invalid request for fallback' };
      }

      // Check if it's time for fallback (within 120 minutes of start)
      const now = new Date();
      const fallbackTime = new Date(request.scheduledStartTime.getTime() - 120 * 60 * 1000);

      if (now < fallbackTime) {
        return { error: 'Too early for fallback (before 120-minute mark)' };
      }

      // Try to find a candidate match
      const candidateMatch = await this.findCandidateMatch(request);

      if (!candidateMatch) {
        // No candidate found, keep waiting
        return { success: false, message: 'No candidate match found' };
      }

      // Perform the match
      const result = await this.matchRequests(request._id, candidateMatch._id, 'peer');

      if (result.error) {
        return { error: result.error };
      }

      // Update fallbackAppliedAt
      await MatchingRequest.updateOne(
        { _id: request._id },
        { fallbackAppliedAt: new Date() }
      );

      return { success: true, result };
    } catch (err) {
      console.error('Error applying scheduled fallback:', err);
      return { error: err.message };
    }
  }

  /**
   * Instant interview matching with fallback
   * @param {String} requestId - The new instant interview request ID
   * @returns {Object} - { matched: true/false, result } or { error }
   */
  static async matchInstantInterview(requestId) {
    try {
      const request = await MatchingRequest.findById(requestId);

      if (!request || request.status !== 'waiting' || request.type !== 'instant') {
        return { error: 'Invalid instant request' };
      }

      console.log(`\n  > Searching for interviewer match...`);
      // Step 1: Try to find an interviewer match
      const interviewerMatch = await this.findInterviewerMatch(request);

      if (interviewerMatch) {
        console.log(`    ✓ Found interviewer match: ${interviewerMatch.userId}`);
        const result = await this.matchRequests(requestId, interviewerMatch._id, 'interviewer');
        if (!result.error) {
          return { matched: true, matchType: 'interviewer', result };
        }
        console.log(`    ✗ Match attempt failed: ${result.error}`);
        // If matching failed (maybe already matched), continue to step 2
      } else {
        console.log(`    ✗ No interviewer found`);
      }

      // Step 2: Try to find a candidate match (fallback)
      console.log(`  > Searching for candidate match (peer fallback)...`);
      const candidateMatch = await this.findCandidateMatch(request);

      if (candidateMatch) {
        console.log(`    ✓ Found candidate match: ${candidateMatch.userId}`);
        const result = await this.matchRequests(requestId, candidateMatch._id, 'peer');
        if (!result.error) {
          return { matched: true, matchType: 'peer', result };
        }
        console.log(`    ✗ Match attempt failed: ${result.error}`);
      } else {
        console.log(`    ✗ No candidate found`);
      }

      // No match found
      return { matched: false, message: 'Waiting for a peer...' };
    } catch (err) {
      console.error('Error matching instant interview:', err);
      return { error: err.message };
    }
  }

  /**
   * Apply instant fallback to candidate-candidate matching
   * Used for instant interviews when no interviewer is found within 30 seconds
   * @param {String} requestId - The request ID to apply fallback for
   * @returns {Object} - { success, result } or { error }
   */
  static async applyInstantFallback(requestId) {
    try {
      const request = await MatchingRequest.findById(requestId);

      if (!request || request.status !== 'waiting' || request.type !== 'instant') {
        return { error: 'Invalid request for fallback' };
      }

      // Check if already matched
      if (request.matchedWith) {
        return { error: 'Request already matched' };
      }

      // Try to find a candidate match (any candidate, not just interviewers)
      const candidateMatch = await this.findCandidateMatch(request);

      if (!candidateMatch) {
        // No candidate found, keep waiting
        return { success: false, message: 'No candidate match found yet' };
      }

      // Perform the match
      const result = await this.matchRequests(request._id, candidateMatch._id, 'peer');

      if (result.error) {
        return { error: result.error };
      }

      // Update fallbackAppliedAt
      await MatchingRequest.updateOne(
        { _id: request._id },
        { fallbackAppliedAt: new Date() }
      );

      return { success: true, result };
    } catch (err) {
      console.error('Error applying instant fallback:', err);
      return { error: err.message };
    }
  }

  /**
   * Cancel a matching request
   * @param {String} requestId - The request ID to cancel
   * @returns {Boolean} - Success or failure
   */
  static async cancelRequest(requestId) {
    try {
      await MatchingRequest.updateOne(
        { _id: requestId },
        { status: 'cancelled', expiredAt: new Date() }
      );
      return true;
    } catch (err) {
      console.error('Error cancelling request:', err);
      return false;
    }
  }

  /**
   * Get opposite role preference
   * @param {String} role - 'candidate' or 'interviewer'
   * @returns {String} - Opposite role
   */
  static getOppositeRole(role) {
    return role === 'candidate' ? 'interviewer' : 'candidate';
  }

  /**
   * Expire old waiting requests (for instant interviews)
   * @param {Number} maxWaitSeconds - Maximum wait time in seconds (default: 3600)
   */
  static async expireOldRequests(maxWaitSeconds = 3600) {
    try {
      const cutoffTime = new Date(Date.now() - maxWaitSeconds * 1000);
      const result = await MatchingRequest.updateMany(
        {
          type: 'instant',
          status: 'waiting',
          createdAt: { $lt: cutoffTime }
        },
        {
          status: 'expired',
          expiredAt: new Date()
        }
      );
      console.log(`Expired ${result.modifiedCount} old instant requests`);
    } catch (err) {
      console.error('Error expiring old requests:', err);
    }
  }
}

module.exports = MatchingService;
