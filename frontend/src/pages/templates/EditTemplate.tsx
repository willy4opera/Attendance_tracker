import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AiOutlineSave } from 'react-icons/ai';

const EditTemplate: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSaving(false);
    navigate(`/templates/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl mb-4">Edit Template</h1>
      <div className="mb-4">
        <label>Template Name</label>
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="w-full p-2 border"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={isSaving || !templateName}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isSaving ? 'Saving...' : 'Save Template'}
      </button>
    </div>
  );
};

export default EditTemplate;
