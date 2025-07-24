import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface ProjectBoardDebugProps {
  projectId: string;
}

const ProjectBoardDebug: React.FC<ProjectBoardDebugProps> = ({ projectId }) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        const info: any = {};
        
        // 1. Get all boards
        const allBoardsRes = await api.get('/boards');
        info.totalBoards = allBoardsRes.data.data.boards.length;
        info.allBoards = allBoardsRes.data.data.boards.map((b: any) => ({
          id: b.id,
          name: b.name,
          projectId: b.projectId,
          project: b.project?.name
        }));
        
        // 2. Get boards with projectId filter
        const filteredRes = await api.get('/boards', { 
          params: { projectId: projectId } 
        });
        info.filteredBoards = filteredRes.data.data.boards.length;
        info.filteredBoardsList = filteredRes.data.data.boards;
        
        // 3. Check alternative endpoint
        try {
          const altRes = await api.get(`/projects/${projectId}/boards`);
          info.alternativeEndpoint = {
            success: true,
            count: altRes.data.data?.length || altRes.data.data?.boards?.length || 0,
            data: altRes.data.data
          };
        } catch (error: any) {
          info.alternativeEndpoint = {
            success: false,
            error: error.response?.status + ' ' + error.response?.statusText
          };
        }
        
        // 4. Check if projectId is correct type
        info.projectIdInfo = {
          value: projectId,
          type: typeof projectId,
          parsed: parseInt(projectId)
        };
        
        setDebugInfo(info);
      } catch (error) {
        console.error('Debug error:', error);
        setDebugInfo({ error: error.toString() });
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();
  }, [projectId]);

  if (loading) return <div>Loading debug info...</div>;

  return (
    <div className="bg-gray-100 p-4 rounded-lg text-xs font-mono">
      <h3 className="font-bold mb-2">Project-Board Debug Info</h3>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
};

export default ProjectBoardDebug;
