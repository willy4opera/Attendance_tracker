import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ProjectWorkflowDemo } from '../../components/projects/ProjectWorkflowDemo'
import { 
  ArrowLeftIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  CubeIcon,
  VideoCameraIcon,
  PauseIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline'

const WorkflowDemo: React.FC = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Simulated video timeline steps
  const videoSteps = [
    {
      time: "0:00",
      title: "Welcome & Overview",
      description: "Introduction to the project management workflow"
    },
    {
      time: "0:30",
      title: "Creating a Project",
      description: "Setting up a new project with team members and goals"
    },
    {
      time: "1:15",
      title: "Adding Boards",
      description: "Creating Kanban boards within the project structure"
    },
    {
      time: "2:00",
      title: "Task Management",
      description: "Creating, organizing, and assigning tasks on boards"
    },
    {
      time: "2:45",
      title: "Team Collaboration",
      description: "Comments, mentions, and real-time activity feeds"
    },
    {
      time: "3:30",
      title: "Progress Tracking",
      description: "Monitoring project progress and team performance"
    }
  ]

  const demoScenarios = [
    {
      title: "E-commerce Website Development",
      description: "Complete development lifecycle from planning to deployment",
      duration: "4:32",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop",
      steps: [
        "Create 'E-commerce Platform' project",
        "Set up 'Frontend Development' board",
        "Add 'Backend API' and 'Database Design' boards", 
        "Create tasks: User Authentication, Product Catalog, Shopping Cart",
        "Assign team members and set deadlines",
        "Track progress with real-time updates"
      ]
    },
    {
      title: "Marketing Campaign Launch",
      description: "From strategy to execution of a digital marketing campaign",
      duration: "3:47",
      thumbnail: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=300&h=200&fit=crop",
      steps: [
        "Create 'Q4 Holiday Campaign' project",
        "Set up boards: Strategy, Content Creation, Distribution",
        "Add tasks: Market Research, Design Assets, Social Media Posts",
        "Collaborate with comments and file attachments",
        "Monitor campaign performance metrics",
        "Adjust strategy based on real-time data"
      ]
    },
    {
      title: "Product Launch Event",
      description: "Organizing a comprehensive product launch event",
      duration: "5:12",
      thumbnail: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&h=200&fit=crop",
      steps: [
        "Create 'Product Launch 2025' project",
        "Boards: Venue & Logistics, Marketing, Guest Management",
        "Tasks: Venue booking, Catering, Press releases, Invitations",
        "Coordinate with external vendors through shared boards",
        "Real-time updates on event preparation status",
        "Post-event analysis and feedback collection"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              to="/projects"
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Projects
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Project-Board-Task Workflow Demo
            </h1>
            <p className="mt-3 text-lg text-gray-600 max-w-3xl mx-auto">
              Watch how to organize your work efficiently using our integrated 
              project management system. Follow along with real examples and best practices.
            </p>
          </div>
        </div>

        {/* Main Video Demo */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="relative">
            {/* Video Player Mockup */}
            <div className="relative bg-gray-900 aspect-video">
              <img 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=675&fit=crop"
                alt="Project Management Demo"
                className="w-full h-full object-cover"
              />
              
              {/* Video Overlay Controls */}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <button
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 transition-colors"
                >
                  {isVideoPlaying ? (
                    <PauseIcon className="h-12 w-12" />
                  ) : (
                    <PlayCircleIcon className="h-12 w-12" />
                  )}
                </button>
              </div>

              {/* Video Info Overlay */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <VideoCameraIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Live Demo: Complete Workflow</span>
                </div>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="bg-black bg-opacity-60 text-white p-2 rounded-lg hover:bg-opacity-80"
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="h-4 w-4" />
                  ) : (
                    <SpeakerWaveIcon className="h-4 w-4" />
                  )}
                </button>
                <div className="bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg text-sm">
                  4:32 / 4:32
                </div>
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40 p-2">
                <div className="bg-gray-600 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: isVideoPlaying ? '100%' : '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* Video Timeline */}
            <div className="p-4 bg-gray-50 border-t">
              <h3 className="font-medium text-gray-900 mb-3">Video Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {videoSteps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      currentStep === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <span className="text-sm font-medium text-blue-600">{step.time}</span>
                      <span className="ml-2 text-sm font-medium text-gray-900">{step.title}</span>
                    </div>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Scenarios */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Real-World Demo Scenarios</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {demoScenarios.map((scenario, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="relative">
                  <img 
                    src={scenario.thumbnail}
                    alt={scenario.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button className="bg-white text-gray-900 rounded-full p-3 hover:bg-gray-100">
                      <PlayCircleIcon className="h-8 w-8" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                    {scenario.duration}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{scenario.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Demo Steps:</h4>
                    <ul className="space-y-1">
                      {scenario.steps.slice(0, 3).map((step, stepIndex) => (
                        <li key={stepIndex} className="text-xs text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {step}
                        </li>
                      ))}
                      {scenario.steps.length > 3 && (
                        <li className="text-xs text-gray-500">
                          +{scenario.steps.length - 3} more steps...
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                    Watch Demo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Workflow Guide */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Interactive Workflow Guide
            </h2>
            <Link
              to="/projects/create"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Try It Yourself
              <ArrowPathIcon className="h-4 w-4 ml-2" />
            </Link>
          </div>
          <ProjectWorkflowDemo />
        </div>

        {/* Step-by-Step Guide */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Step-by-Step Implementation Guide</h2>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Create Your Project</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Start by defining your project scope, timeline, and team members. Set clear objectives and deliverables.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <code className="text-sm text-gray-800">
                    Project: "Mobile App Development" → Team: 5 developers → Timeline: 3 months
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Design Your Boards</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Create boards that represent different workflows or phases of your project. Common patterns include feature-based or sprint-based boards.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <code className="text-sm text-gray-800">
                    Boards: "Frontend Features" | "Backend API" | "Testing & QA" | "Deployment"
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Organize with Task Lists</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Within each board, create lists that represent the stages of work. Use consistent naming across boards for clarity.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <code className="text-sm text-gray-800">
                    Lists: "Backlog" → "In Progress" → "Review" → "Testing" → "Done"
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Create and Assign Tasks</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Break down work into specific, actionable tasks. Include detailed descriptions, due dates, and assign to team members.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <code className="text-sm text-gray-800">
                    Task: "User Login Component" → Assigned: John Doe → Due: Next Friday → Priority: High
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-semibold">
                5
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Collaborate and Track</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Use comments, mentions, and real-time activity feeds to maintain communication and track progress across the entire project.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <code className="text-sm text-gray-800">
                    @jane: "Login API is ready for testing" → Activity: "Task moved to Testing" → Progress: 75%
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of teams who have streamlined their project management 
              with our integrated workflow system. Start organizing your work today.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/projects/create"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Create Your First Project
              </Link>
              <Link
                to="/projects"
                className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                View All Projects
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Documentation</h3>
            <p className="text-gray-600 text-sm mb-4">
              Comprehensive guides and API documentation for advanced users.
            </p>
            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Read the docs →
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <CubeIcon className="h-8 w-8 text-green-600 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Templates</h3>
            <p className="text-gray-600 text-sm mb-4">
              Pre-built project templates for common workflows and industries.
            </p>
            <a href="#" className="text-green-600 hover:text-green-700 text-sm font-medium">
              Browse templates →
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <PlayCircleIcon className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Training</h3>
            <p className="text-gray-600 text-sm mb-4">
              Video tutorials and best practices for maximizing productivity.
            </p>
            <a href="#" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              Watch tutorials →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkflowDemo
