import axios from 'axios';

// API base URL - adjust if needed
const API_BASE_URL = 'https://192.168.0.124:5173/api/v1';

async function testProjectBoardRelationship() {
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'willy4opera@gmail.com',
      password: 'Wind@wswil24d'
    }, {
      httpsAgent: new (await import('https')).Agent({
        rejectUnauthorized: false
      })
    });
    
    const { accessToken } = loginResponse.data.data;
    console.log('✓ Login successful');
    
    // Set auth header for subsequent requests
    const authConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      httpsAgent: new (await import('https')).Agent({
        rejectUnauthorized: false
      })
    };
    
    // 2. Get projects
    console.log('\n2. Fetching projects...');
    const projectsResponse = await axios.get(`${API_BASE_URL}/projects`, authConfig);
    const projects = projectsResponse.data.data.projects;
    console.log(`✓ Found ${projects.length} projects`);
    
    // Display project details
    projects.forEach(project => {
      console.log(`\nProject: ${project.name} (ID: ${project.id})`);
      console.log(`  - Status: ${project.status}`);
      console.log(`  - Board Count: ${project.boardCount || project.stats?.boardCount || 0}`);
      console.log(`  - Stats:`, project.stats || 'No stats');
    });
    
    // 3. Get boards for each project
    console.log('\n3. Checking boards for each project...');
    for (const project of projects) {
      try {
        // Try method 1: Get boards with projectId filter
        const boardsResponse = await axios.get(`${API_BASE_URL}/boards`, {
          ...authConfig,
          params: { projectId: project.id }
        });
        const boards = boardsResponse.data.data.boards;
        console.log(`\nProject "${project.name}" has ${boards.length} boards (using filter)`);
        
        // List board names
        if (boards.length > 0) {
          boards.forEach(board => {
            console.log(`    • ${board.name} (ID: ${board.id}, ProjectID: ${board.projectId})`);
          });
        }
      } catch (error) {
        console.error(`  Error fetching boards: ${error.message}`);
      }
    }
    
    // 4. Get all boards to check projectId field
    console.log('\n4. Fetching all boards to check project associations...');
    const allBoardsResponse = await axios.get(`${API_BASE_URL}/boards`, authConfig);
    const allBoards = allBoardsResponse.data.data.boards;
    console.log(`✓ Total boards in system: ${allBoards.length}`);
    
    // Check how many boards have projectId
    const boardsWithProject = allBoards.filter(board => board.projectId);
    const boardsWithoutProject = allBoards.filter(board => !board.projectId);
    
    console.log(`  - Boards with projectId: ${boardsWithProject.length}`);
    console.log(`  - Boards without projectId: ${boardsWithoutProject.length}`);
    
    // Show first few boards
    console.log('\nFirst 5 boards:');
    allBoards.slice(0, 5).forEach(board => {
      console.log(`  • ${board.name} (ID: ${board.id}, ProjectID: ${board.projectId || 'NULL'}, Project: ${board.project?.name || 'No project'})`);
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run the test
testProjectBoardRelationship();
