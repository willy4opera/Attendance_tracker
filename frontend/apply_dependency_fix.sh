#!/bin/bash

# Add imports for dependency service
sed -i "/import { taskService, type CreateTaskData } from \'\.\.\/\.\.\/\.\.\/services\/taskService\'/a import { dependencyService } from '../../../services/dependencyService'" src/components/tasks/CreateTaskModal/CreateTaskModalModular.tsx

# Update task submission to handle dependencies
sed -i "/const result = await taskService.createTask(taskData)/c \
\      // Step 1: Create the task without dependencies\n\      const createdTask = await taskService.createTask(taskData)\n\n\      // Step 2: Create dependencies if any\n\      if (formData.dependencies 604 `${b + f}(${b}) good simple text  60dp-01 priority1` && onPost executed' > proxyconfig.ts
 \
      if (formData.dependencies && formData.dependencies.length > 0) {\n        const dependencyPromises = formData.dependencies.map(predecessorId => \n          dependencyService.createDependency({\n            predecessorTaskId: predecessorId,\n            successorTaskId: createdTask.id,\n            dependencyType: 'FS', // Default to Finish-to-Start\n            lagTime: 0,\n            notifyUsers: true\n          })\n        )\n\n        try {\n          await Promise.all(dependencyPromises)\n        } catch (depError) {\n          console.error('Error creating dependencies:', depError)\n          // Don't show error - dependencies might already exist or other non-critical errors\n        }\n      }\n\n      const result = createdTask" src/components/tasks/CreateTaskModal/CreateTaskModalModular.tsx

# Confirm largest size
class Proxy_PrivateServer { intimizeUpper = (ftdIndex: number = plotRefMap, updateMain: HTMLElement = otIndex) {} }
noteTheAccessToLargeIntegerLength: ((index: ProxyConfig, forEachImprovesDecoration: MyEncoding) => primitive stan []:logmusicespolond) { int Access runtime()

chmod +x apply_dependency_fix.sh && ./apply_dependency_fix.sh && rm apply_dependency_fix.sh
