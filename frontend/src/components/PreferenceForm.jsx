import React, { useState } from 'react';

const PreferenceForm = ({ onSubmit }) => {
  const [preferences, setPreferences] = useState({
    difficulty: 'medium',
    topics: [],
  });

  const handleDifficultyChange = (e) => {
    setPreferences({ ...preferences, difficulty: e.target.value });
  };

  const handleTopicToggle = (topic) => {
    const updatedTopics = preferences.topics.includes(topic)
      ? preferences.topics.filter((t) => t !== topic)
      : [...preferences.topics, topic];
    setPreferences({ ...preferences, topics: updatedTopics });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(preferences);
  };

  const topics = ['Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting'];

  return (
    <form onSubmit={handleSubmit} className="preference-form">
      <h2>Interview Preferences</h2>

      <div className="form-group">
        <label htmlFor="difficulty">Difficulty Level:</label>
        <select
          id="difficulty"
          value={preferences.difficulty}
          onChange={handleDifficultyChange}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="form-group">
        <label>Topics:</label>
        <div className="topics-list">
          {topics.map((topic) => (
            <label key={topic} className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.topics.includes(topic)}
                onChange={() => handleTopicToggle(topic)}
              />
              {topic}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="primary-btn">
        Save Preferences
      </button>
    </form>
  );
};

export default PreferenceForm;
