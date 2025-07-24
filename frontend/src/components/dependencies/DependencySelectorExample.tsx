// Example of how to integrate DependencySelector into CreateTaskModal

// 1. Import the component at the top of CreateTaskModal.tsx:
// import { DependencySelector } from '../dependencies'

// 2. Add state for managing the dependency selector modal:
// const [showDependencySelector, setShowDependencySelector] = useState(false)

// 3. Replace the existing dependency dropdown with a button and modal:
/*
<div>
  <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.secondary }}>
    Task Dependencies
  </label>
  
  {/* Current dependencies list */}
  {formData.dependencies && formData.dependencies.length > 0 && (
    <div className="mb-3 space-y-2">
      {formData.dependencies.map((depId, index) => {
        const depTask = availableTasks.find(t => t.id === depId)
        return (
          <div key={depId} className="flex items-center justify-between p-2 rounded-lg" 
               style={{ backgroundColor: theme.colors.primary + '20' }}>
            <span className="text-sm" style={{ color: theme.colors.secondary }}>
              {depTask?.title || `Task #${depId}`}
            </span>
            <button
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                dependencies: prev.dependencies?.filter(id => id !== depId) || []
              }))}
              className="text-red-500 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )}
  
  {/* Add dependency button */}
  <button
    type="button"
    onClick={() => setShowDependencySelector(true)}
    className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
    style={{
      backgroundColor: theme.colors.secondary,
      color: theme.colors.primary,
      border: `2px solid ${theme.colors.primary}`
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = theme.colors.primary
      e.currentTarget.style.color = theme.colors.secondary
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = theme.colors.secondary
      e.currentTarget.style.color = theme.colors.primary
    }}
  >
    <LinkIcon className="h-5 w-5" />
    Add Dependency
  </button>
</div>

{/* Dependency Selector Modal */}
{showDependencySelector && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity" 
           onClick={() => setShowDependencySelector(false)} />
      
      <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
        <div className="relative px-6 py-4" 
             style={{ background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.secondary}dd 100%)` }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold" style={{ color: theme.colors.primary }}>
              Add Task Dependency
            </h3>
            <button
              onClick={() => setShowDependencySelector(false)}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <DependencySelector
            onDependencySelected={(dependency) => {
              // Add the dependency to the form
              setFormData(prev => ({
                ...prev,
                dependencies: [...(prev.dependencies || []), dependency.predecessorTaskId]
              }))
              setShowDependencySelector(false)
              
              // Show success message
              Swal.fire({
                icon: 'success',
                title: 'Dependency Added',
                text: `Task dependency has been added successfully!`,
                showConfirmButton: false,
                timer: 2000,
                background: theme.colors.background.paper,
                color: theme.colors.text.primary
              })
            }}
            currentTaskId={0} // Since this is a new task, we don't have an ID yet
            availableTasks={availableTasks}
            projectMembers={[
              // Map your project members here
              // Example: selectedUsers.map(user => ({ id: user.id, name: user.name, email: user.email, role: 'member' }))
            ]}
          />
        </div>
      </div>
    </div>
  </div>
)}
*/
