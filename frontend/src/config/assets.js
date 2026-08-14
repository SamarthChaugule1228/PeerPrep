/**
 * Asset Configuration
 * Centralized imported URLs for all images and assets.
 */

import heroDevelopers from '../assets/illustrations/hero-developers-collaboration.png';
import matchingAvatars from '../assets/illustrations/matching-avatars-connecting.png';
import waitingInterviewer from '../assets/illustrations/waiting-interviewer-calendar.png';
import unavailableInterviewer from '../assets/illustrations/unavailable-interviewer-handshake.png';
import celebration from '../assets/illustrations/celebration-partnership-high-five.png';

import logoIcon from '../assets/logos/logo-peerprep-icon.png';
import logoHorizontal from '../assets/logos/logo-peerprep-horizontal.png';
import logoHorizontalWhite from '../assets/logos/logo-peerprep-horizontal-white.png';

import avatarFemalePlaceholder1 from '../assets/avatars/avatar-placeholder-female-1.png';
import avatarMalePlaceholder1 from '../assets/avatars/avatar-placeholder-male-1.png';
import avatarNeutral from '../assets/avatars/avatar-placeholder-neutral.png';

import heroGradient from '../assets/backgrounds/bg-gradient-hero-purple-blue.png';
import particles from '../assets/backgrounds/bg-particles-animated.png';

export const ASSETS = {
  illustrations: {
    heroDevelopers,
    matchingAvatars,
    waitingInterviewer,
    unavailableInterviewer,
    celebration,
    interviewRoom: heroDevelopers,
    profileEditing: heroDevelopers,
    feedbackStars: celebration,
    notFound: heroDevelopers,
    emptyState: matchingAvatars,
  },

  logos: {
    icon: logoIcon,
    iconWhite: logoIcon,
    horizontal: logoHorizontal,
    horizontalWhite: logoHorizontalWhite,
    vertical: logoHorizontal,
  },

  avatars: {
    malePlaceholder1: avatarMalePlaceholder1,
    malePlaceholder2: avatarMalePlaceholder1,
    femalePlaceholder1: avatarFemalePlaceholder1,
    femalePlaceholder2: avatarFemalePlaceholder1,
    neutral: avatarNeutral,
    defaultIcon: avatarNeutral,
    interviewerBadge: avatarNeutral,
  },

  backgrounds: {
    heroGradient,
    cardGradient: heroGradient,
    particles,
    gridPattern: particles,
    blobs: particles,
  },
};

export default ASSETS;
