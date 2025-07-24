// Test script to check project-board relationship
import api from '../services/api';

export const testProjectBoardRelationship = async () => {
  try {
    console.log('=== Testing Project-Board Relationship ===');
    
    // 1. Get all projects
    const projectsResponse = await api.get('/projects');
    const projects = projectsResponse.data.data.projects;
    console.log(`Found ${projects.length} projects`);
    
    if (projects.length > 0) {
      const firstProject = projects[0];
      console.log(`\nTesting with project: ${firstProject.name} (ID: ${firstProject.id})`);
      
      // 2. Get all boards
      const allBoardsResponse = await api.get('/boards');
      const allBoards = allBoardsResponse.data.data.boards;
      console.log(`\nTotal boards in system: ${allBoards.length}`);
      
      // 3. Get boards filtered by projectId
      const projectBoardsResponse = await api.get('/boards', {
        params: { projectId: firstProject.id }
      });
      const projectBoards = projectBoardsResponse.data.data.boards;
      console.log(`\nBoards for project ${firstProject.id}: ${projectBoards.length}`);
      
      // 4. Try alternative endpoint
      try {
        const altResponse = await api.get(`/projects/${firstProject.id}/boards`);
        console.log(`\nAlternative endpoint /projects/${firstProject.id}/boards:`, altResponse.data);
      } catch (error: any) {
        console.log(`\nAlternative endpoint failed:`, error.response?.status, error.response?.data);
      }
      
      // 5. Check board structure
      if (allBoards.length > 0) {
        console.log('\nFirst board structure:');
        console.log('- ID:', allBoards[0].id);
        console.log('- Name:', allBoards[0].name);
        console.log('- Project ID:', allBoards[0].projectId);
        console.log('- Project:', allBoards[0].project);
      }
      
      // 6. Create a test board for the project
      console.log('\nTrying to create a board for the project...');
      try {
        const newBoard = await api.post('/boards', {
          name: 'Test Board for Project',
          description: 'Testing project-board relationship',
          projectId: firstProject.id,
          visibility: 'private'
        });
        console.log('Successfully created board:', newBoard.data);
        
        // Check if it appears in filtered results
        const updatedProjectBoards = await api.get('/boards', {
          params: { projectId: firstProject.id }
        });
        console.log(`\nBoards for project after creation: ${updatedProjectBoards.data.data.boards.length}`);
      } catch (error: any) {
        console.log('Failed to create board:', error.response?.data);
      }
    }
    
  } catch (error: any) {
    console.error('Test failed:', error);
    console.error('Error details:', error.response?.data);
  }
};

// Run the test
testProjectBoardRelationship();
