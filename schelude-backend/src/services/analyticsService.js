const Session = require('../models/Session');
const Room = require('../models/Room');
const User = require('../models/User');

const analyticsService = {
  // Room utilization
  getRoomUtilization: async (startDate, endDate) => {
    const rooms = await Room.find({ isActive: true });
    const totalHours = (endDate - startDate) / (1000 * 60 * 60);
    const workingHoursPerDay = 10; // 8:00 - 18:00
    const days = Math.ceil(totalHours / 24);
    const maxPossibleHours = workingHoursPerDay * days;

    const utilization = [];

    for (const room of rooms) {
      const sessions = await Session.find({
        room: room._id,
        status: { $ne: 'cancelled' },
        startAt: { $gte: startDate, $lte: endDate }
      });

      const totalUsedMinutes = sessions.reduce((sum, session) => {
        return sum + (new Date(session.endAt) - new Date(session.startAt)) / (1000 * 60);
      }, 0);

      const usedHours = totalUsedMinutes / 60;
      const utilizationPercent = (usedHours / maxPossibleHours) * 100;

      utilization.push({
        roomId: room._id,
        roomNumber: room.number,
        building: room.building,
        usedHours: Math.round(usedHours * 10) / 10,
        maxHours: maxPossibleHours,
        utilizationPercent: Math.round(utilizationPercent * 10) / 10,
        sessionCount: sessions.length
      });
    }

    return utilization.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
  },

  // Teacher load
  getTeacherLoad: async (startDate, endDate) => {
    const teachers = await User.find({ role: 'teacher', isActive: true });
    const load = [];

    for (const teacher of teachers) {
      const sessions = await Session.find({
        teacher: teacher._id,
        status: { $ne: 'cancelled' },
        startAt: { $gte: startDate, $lte: endDate }
      }).populate('course', 'name');

      const totalMinutes = sessions.reduce((sum, session) => {
        return sum + (new Date(session.endAt) - new Date(session.startAt)) / (1000 * 60);
      }, 0);

      const courseCount = new Set(sessions.map(s => s.course._id.toString())).size;

      load.push({
        teacherId: teacher._id,
        teacherName: teacher.name,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        sessionCount: sessions.length,
        courseCount: courseCount
      });
    }

    return load.sort((a, b) => b.totalHours - a.totalHours);
  },

  // Session type distribution
  getSessionTypeStats: async (startDate, endDate) => {
    const result = await Session.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          startAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalMinutes: {
            $sum: {
              $divide: [
                { $subtract: ['$endAt', '$startAt'] },
                1000 * 60
              ]
            }
          }
        }
      }
    ]);

    return result.map(item => ({
      type: item._id,
      count: item.count,
      totalHours: Math.round(item.totalMinutes / 60 * 10) / 10
    }));
  },

  // Conflicts
  findConflicts: async (startDate, endDate) => {
    const sessions = await Session.find({
      status: { $ne: 'cancelled' },
      startAt: { $gte: startDate, $lte: endDate }
    })
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .populate('room', 'number building')
      .sort({ startAt: 1 });

    const conflicts = [];

    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const s1 = sessions[i];
        const s2 = sessions[j];

        const s1Start = new Date(s1.startAt);
        const s1End = new Date(s1.endAt);
        const s2Start = new Date(s2.startAt);
        const s2End = new Date(s2.endAt);

        // Check time overlap
        if (s1Start < s2End && s2Start < s1End) {
          // Room conflict
          if (s1.room._id.toString() === s2.room._id.toString()) {
            conflicts.push({
              type: 'room',
              session1: s1,
              session2: s2,
              message: `Конфликт аудитории ${s1.room.building} ${s1.room.number}`
            });
          }

          // Teacher conflict
          if (s1.teacher._id.toString() === s2.teacher._id.toString()) {
            conflicts.push({
              type: 'teacher',
              session1: s1,
              session2: s2,
              message: `Конфликт преподавателя ${s1.teacher.name}`
            });
          }

          // Group conflict
          const commonGroups = s1.groups.filter(g => s2.groups.includes(g));
          if (commonGroups.length > 0) {
            conflicts.push({
              type: 'group',
              session1: s1,
              session2: s2,
              groups: commonGroups,
              message: `Конфликт групп: ${commonGroups.join(', ')}`
            });
          }
        }
      }
    }

    return conflicts;
  }
};

module.exports = analyticsService;
