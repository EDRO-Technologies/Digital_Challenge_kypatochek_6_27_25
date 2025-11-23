const Session = require('../models/Session');

class ConflictService {
  /**
   * Check for scheduling conflicts
   * @param {Object} sessionData - Session data to check
   * @param {String} excludeSessionId - Session ID to exclude from conflict check (for updates)
   * @returns {Object} - Conflict results
   */
  async checkConflicts(sessionData, excludeSessionId = null) {
    const { room, teacher, groups, startAt, endAt } = sessionData;
    const conflicts = {
      hasConflict: false,
      roomConflict: null,
      teacherConflict: null,
      groupConflicts: []
    };

    // Build base query - find sessions that overlap in time
    const baseQuery = {
      status: { $nin: ['cancelled'] },
      $or: [
        // New session starts during existing session
        { startAt: { $lte: startAt }, endAt: { $gt: startAt } },
        // New session ends during existing session
        { startAt: { $lt: endAt }, endAt: { $gte: endAt } },
        // New session completely contains existing session
        { startAt: { $gte: startAt }, endAt: { $lte: endAt } }
      ]
    };

    // Exclude current session if updating
    if (excludeSessionId) {
      baseQuery._id = { $ne: excludeSessionId };
    }

    // Check room conflicts
    if (room) {
      const roomConflict = await Session.findOne({
        ...baseQuery,
        room
      }).populate('course', 'name code');

      if (roomConflict) {
        conflicts.hasConflict = true;
        conflicts.roomConflict = {
          session: roomConflict,
          message: `Room is already booked for ${roomConflict.course.name} (${roomConflict.course.code})`
        };
      }
    }

    // Check teacher conflicts
    if (teacher) {
      const teacherConflict = await Session.findOne({
        ...baseQuery,
        teacher
      }).populate('course', 'name code').populate('teacher', 'name');

      if (teacherConflict) {
        conflicts.hasConflict = true;
        conflicts.teacherConflict = {
          session: teacherConflict,
          message: `Teacher ${teacherConflict.teacher.name} is already scheduled for ${teacherConflict.course.name}`
        };
      }
    }

    // Check group conflicts
    if (groups && groups.length > 0) {
      for (const group of groups) {
        const groupConflict = await Session.findOne({
          ...baseQuery,
          groups: group
        }).populate('course', 'name code');

        if (groupConflict) {
          conflicts.hasConflict = true;
          conflicts.groupConflicts.push({
            group,
            session: groupConflict,
            message: `Group ${group} already has a session: ${groupConflict.course.name}`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Validate time constraints
   */
  validateTimeConstraints(startAt, endAt) {
    const start = new Date(startAt);
    const end = new Date(endAt);

    const errors = [];

    // Check if end is after start
    if (end <= start) {
      errors.push('Session end time must be after start time');
    }

    // Check if session duration is reasonable (e.g., max 8 hours)
    const durationHours = (end - start) / (1000 * 60 * 60);
    if (durationHours > 8) {
      errors.push('Session duration cannot exceed 8 hours');
    }

    if (durationHours < 0.25) {
      errors.push('Session duration must be at least 15 minutes');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if session can be edited (5 hour rule)
   */
  canEditSession(session, userRole) {
    // Superadmin can override
    if (userRole === 'superadmin') {
      return { canEdit: true, reason: null };
    }

    const now = new Date();
    const hoursUntilStart = (new Date(session.startAt) - now) / (1000 * 60 * 60);

    if (hoursUntilStart <= 5) {
      return {
        canEdit: false,
        reason: `Cannot edit session less than 5 hours before start time. ${hoursUntilStart.toFixed(1)} hours remaining.`
      };
    }

    return { canEdit: true, reason: null };
  }
}

module.exports = new ConflictService();
