const { sequelize } = require('../models');

exports.getAggregateStats = async () => {
  try {
    // --- PROJECT LEVEL AGGREGATE STATISTICS ---
    const [projectAggregateStats] = await sequelize.query(`
      WITH project_task_stats AS (
        SELECT 
          p.id AS project_id,
          p.name AS project_name,
          p.status AS project_status,
          p.description AS project_description,
          p.start_date,
          p.end_date,
          d.name AS department_name,
          COUNT(DISTINCT b.id) AS board_count,
          COUNT(DISTINCT t.id) AS task_count,
          COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS completed_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'in-progress' THEN t.id END) AS in_progress_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) AS todo_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'under-review' THEN t.id END) AS review_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'archived' THEN t.id END) AS archived_tasks
        FROM "Projects" p
        LEFT JOIN "Departments" d ON p.department_id = d.id
        LEFT JOIN "Boards" b ON b.project_id = p.id
        LEFT JOIN "Tasks" t ON t.board_id = b.id
        GROUP BY p.id, p.name, p.status, p.description, p.start_date, p.end_date, d.name
      ),
      project_members AS (
        SELECT 
          b.project_id,
          unnest(t.assigned_to) AS member_id
        FROM "Tasks" t
        JOIN "Boards" b ON t.board_id = b.id
        WHERE t.assigned_to IS NOT NULL AND array_length(t.assigned_to, 1) > 0
      ),
      project_member_counts AS (
        SELECT
          project_id,
          COUNT(DISTINCT member_id) as unique_members
        FROM project_members
        GROUP BY project_id
      )
      SELECT
        pts.*,
        COALESCE(pmc.unique_members, 0) AS member_count,
        CASE 
          WHEN pts.task_count > 0 
          THEN ROUND((pts.completed_tasks::numeric / pts.task_count) * 100, 2)
          ELSE 0 
        END AS completion_percentage
      FROM project_task_stats pts
      LEFT JOIN project_member_counts pmc ON pts.project_id = pmc.project_id
      ORDER BY pts.project_name
    `);

    // --- BOARD LEVEL AGGREGATE STATISTICS ---
    const [boardAggregateStats] = await sequelize.query(`
      WITH board_task_stats AS (
        SELECT 
          b.id AS board_id,
          b.name AS board_name,
          b.description AS board_description,
          p.id AS project_id,
          p.name AS project_name,
          COUNT(DISTINCT t.id) AS task_count,
          COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS completed_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'in-progress' THEN t.id END) AS in_progress_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) AS todo_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'under-review' THEN t.id END) AS review_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'archived' THEN t.id END) AS archived_tasks
        FROM "Boards" b
        LEFT JOIN "Projects" p ON b.project_id = p.id
        LEFT JOIN "Tasks" t ON t.board_id = b.id
        GROUP BY b.id, b.name, b.description, p.id, p.name
      ),
      board_members AS (
        SELECT 
          t.board_id,
          unnest(t.assigned_to) AS member_id
        FROM "Tasks" t
        WHERE t.assigned_to IS NOT NULL AND array_length(t.assigned_to, 1) > 0
      ),
      board_member_counts AS (
        SELECT
          board_id,
          COUNT(DISTINCT member_id) as unique_members
        FROM board_members
        GROUP BY board_id
      )
      SELECT
        bts.*,
        COALESCE(bmc.unique_members, 0) AS member_count,
        CASE 
          WHEN bts.task_count > 0 
          THEN ROUND((bts.completed_tasks::numeric / bts.task_count) * 100, 2)
          ELSE 0 
        END AS completion_percentage
      FROM board_task_stats bts
      LEFT JOIN board_member_counts bmc ON bts.board_id = bmc.board_id
      ORDER BY bts.project_name, bts.board_name
    `);

    // --- OVERALL SUMMARY STATISTICS ---
    const [overallStats] = await sequelize.query(`
      WITH all_stats AS (
        SELECT
          COUNT(DISTINCT p.id) AS total_projects,
          COUNT(DISTINCT b.id) AS total_boards,
          COUNT(DISTINCT t.id) AS total_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS completed_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'in-progress' THEN t.id END) AS in_progress_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) AS todo_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'under-review' THEN t.id END) AS review_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'archived' THEN t.id END) AS archived_tasks
        FROM "Projects" p
        LEFT JOIN "Boards" b ON b.project_id = p.id
        LEFT JOIN "Tasks" t ON t.board_id = b.id
      ),
      all_members AS (
        SELECT unnest(assigned_to) AS member_id
        FROM "Tasks"
        WHERE assigned_to IS NOT NULL AND array_length(assigned_to, 1) > 0
      ),
      all_member_count AS (
        SELECT COUNT(DISTINCT member_id) AS total_unique_members
        FROM all_members
      )
      SELECT
        as1.*,
        amc.total_unique_members,
        CASE 
          WHEN as1.total_tasks > 0 
          THEN ROUND((as1.completed_tasks::numeric / as1.total_tasks) * 100, 2)
          ELSE 0 
        END AS overall_completion_percentage
      FROM all_stats as1, all_member_count amc
    `);

    // --- MEMBER PRODUCTIVITY STATS ---
    const [memberProductivityStats] = await sequelize.query(`
      WITH member_tasks AS (
        SELECT 
          unnest(t.assigned_to) AS member_id,
          t.id AS task_id,
          t.status,
          t.board_id,
          b.project_id
        FROM "Tasks" t
        JOIN "Boards" b ON t.board_id = b.id
        WHERE t.assigned_to IS NOT NULL AND array_length(t.assigned_to, 1) > 0
      )
      SELECT
        u.id AS member_id,
        u.first_name || ' ' || u.last_name AS member_name,
        u.email AS member_email,
        d.name AS department_name,
        u.role AS role_name,
        COUNT(DISTINCT mt.task_id) AS total_assigned_tasks,
        COUNT(DISTINCT CASE WHEN mt.status = 'done' THEN mt.task_id END) AS completed_tasks,
        COUNT(DISTINCT CASE WHEN mt.status = 'in-progress' THEN mt.task_id END) AS in_progress_tasks,
        COUNT(DISTINCT CASE WHEN mt.status = 'todo' THEN mt.task_id END) AS todo_tasks,
        COUNT(DISTINCT CASE WHEN mt.status = 'under-review' THEN mt.task_id END) AS review_tasks,
        COUNT(DISTINCT mt.project_id) AS projects_involved,
        COUNT(DISTINCT mt.board_id) AS boards_involved,
        CASE 
          WHEN COUNT(DISTINCT mt.task_id) > 0 
          THEN ROUND((COUNT(DISTINCT CASE WHEN mt.status = 'done' THEN mt.task_id END)::numeric / COUNT(DISTINCT mt.task_id)) * 100, 2)
          ELSE 0 
        END AS completion_rate
      FROM member_tasks mt
      JOIN "Users" u ON mt.member_id = u.id
      LEFT JOIN "Departments" d ON u.department_id = d.id
      GROUP BY u.id, u.first_name, u.last_name, u.email, d.name, u.role
      ORDER BY completion_rate DESC, total_assigned_tasks DESC
    `);

    // --- PRIORITY DISTRIBUTION ---
    const [priorityStats] = await sequelize.query(`
      SELECT
        priority,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
        COUNT(CASE WHEN status = 'under-review' THEN 1 END) as under_review,
        ROUND(
          CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN status = 'done' THEN 1 END)::numeric / COUNT(*)) * 100 
            ELSE 0 
          END, 2
        ) AS completion_percentage
      FROM "Tasks"
      GROUP BY priority
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `);

    // --- RECENT ACTIVITIES ---
    const [recentCompletions] = await sequelize.query(`
      SELECT
        t.id,
        t.title,
        t.completed_at,
        b.name as board_name,
        p.name as project_name,
        u.first_name || ' ' || u.last_name as creator_name,
        (
          SELECT string_agg(u2.first_name || ' ' || u2.last_name, ', ')
          FROM "Users" u2
          WHERE u2.id = ANY(t.assigned_to)
        ) AS assigned_members
      FROM "Tasks" t
      JOIN "Boards" b ON t.board_id = b.id
      LEFT JOIN "Projects" p ON b.project_id = p.id
      JOIN "Users" u ON t.created_by = u.id
      WHERE t.status = 'done' AND t.completed_at IS NOT NULL
      ORDER BY t.completed_at DESC
      LIMIT 10
    `);

    // --- WEEKLY TRENDS ---
    const [weeklyTrends] = await sequelize.query(`
      WITH weekly_data AS (
        SELECT 
          DATE_TRUNC('week', t.created_at) AS week,
          COUNT(*) AS tasks_created,
          COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS tasks_completed,
          COUNT(DISTINCT t.board_id) AS boards_active,
          COUNT(DISTINCT b.project_id) AS projects_active
        FROM "Tasks" t
        JOIN "Boards" b ON t.board_id = b.id
        WHERE t.created_at >= CURRENT_DATE - INTERVAL '8 weeks'
        GROUP BY DATE_TRUNC('week', t.created_at)
      )
      SELECT
        week,
        tasks_created,
        tasks_completed,
        boards_active,
        projects_active,
        ROUND(
          CASE 
            WHEN tasks_created > 0 
            THEN (tasks_completed::numeric / tasks_created) * 100 
            ELSE 0 
          END, 2
        ) AS completion_rate
      FROM weekly_data
      ORDER BY week DESC
    `);

    return {
      overallStats: overallStats[0],
      projectLevelStats: projectAggregateStats,
      boardLevelStats: boardAggregateStats,
      memberProductivityStats,
      priorityDistribution: priorityStats,
      recentCompletions,
      weeklyTrends
    };

  } catch (error) {
    console.error('Error generating aggregate statistics:', error);
    throw error;
  }
};

// Add this function to get project members with details
exports.getProjectMembers = async (projectId) => {
  try {
    const projectMembers = await sequelize.query(`
      WITH project_task_members AS (
        SELECT DISTINCT
          unnest(t.assigned_to) AS member_id
        FROM "Tasks" t
        JOIN "Boards" b ON t.board_id = b.id
        WHERE b.project_id = :projectId
        AND t.assigned_to IS NOT NULL 
        AND array_length(t.assigned_to, 1) > 0
      ),
      member_stats AS (
        SELECT 
          ptm.member_id,
          COUNT(DISTINCT t.id) AS assigned_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS completed_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'in-progress' THEN t.id END) AS in_progress_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) AS todo_tasks,
          COUNT(DISTINCT b.id) AS boards_involved
        FROM project_task_members ptm
        JOIN "Tasks" t ON ptm.member_id = ANY(t.assigned_to)
        JOIN "Boards" b ON t.board_id = b.id AND b.project_id = :projectId
        GROUP BY ptm.member_id
      )
      SELECT
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.profile_picture,
        u.role,
        d.name AS department_name,
        ms.assigned_tasks,
        ms.completed_tasks,
        ms.in_progress_tasks,
        ms.todo_tasks,
        ms.boards_involved,
        CASE 
          WHEN ms.assigned_tasks > 0 
          THEN ROUND((ms.completed_tasks::numeric / ms.assigned_tasks) * 100, 2)
          ELSE 0 
        END AS completion_rate
      FROM member_stats ms
      JOIN "Users" u ON ms.member_id = u.id
      LEFT JOIN "Departments" d ON u.department_id = d.id
      ORDER BY ms.assigned_tasks DESC
    `, {
      replacements: { projectId },
      type: sequelize.QueryTypes.SELECT
    });

    return projectMembers;
  } catch (error) {
    console.error('Error fetching project members:', error);
    throw error;
  }
};
