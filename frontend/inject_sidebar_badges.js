const fs = require('fs');

const sourcePath = 'frontend/src/components/layout/Sidebar.tsx';
let content = fs.readFileSync(sourcePath, 'utf-8');

// 1. Add Badge to imports
if (!content.includes('Badge')) {
  content = content.replace(
    /import \{([^\}]+)\} from '@mui\/material';/,
    `import {$1, Badge } from '@mui/material';`
  );
}

// 2. Add useEffect and state
const stateInjection = `
  const [badges, setBadges] = React.useState({ room_approvals: 0, food_approvals: 0 });

  React.useEffect(() => {
    if (isAdmin || isManager) {
      const fetchBadges = async () => {
        try {
          const res = await api.get('/approvals/badges');
          if (res.success && res.data) {
            setBadges(res.data);
          }
        } catch (error) {
          console.error('Failed to fetch badges', error);
        }
      };
      fetchBadges();
      // Optional: Polling every 60 seconds
      // const interval = setInterval(fetchBadges, 60000);
      // return () => clearInterval(interval);
    }
  }, [isAdmin, isManager]);
`;

if (!content.includes('const [badges, setBadges]')) {
  content = content.replace(
    /const isAdmin = /m,
    `import * as React from 'react';\nimport api from '../../services/api';\n\n$&`
  ).replace(
    /const menuItems = \[/,
    `${stateInjection}\n  $&`
  );
}

// 3. Update icon rendering in map
// Add badges configuration to menuItems
if (!content.includes('badge: badges.room_approvals')) {
  content = content.replace(
    /path: '\/food-approvals', icon: <RestaurantIcon \/> \}/g,
    `path: '/food-approvals', icon: <RestaurantIcon />, badge: badges.food_approvals }`
  );
  content = content.replace(
    /path: '\/approvals', icon: <CheckCircleIcon \/> \}/g,
    `path: '/approvals', icon: <CheckCircleIcon />, badge: badges.room_approvals }`
  );
}

if (content.includes('{item.icon}')) {
  content = content.replace(
    /\{item\.icon\}/g,
    `{item.badge ? <Badge badgeContent={item.badge} color="error">{item.icon}</Badge> : item.icon}`
  );
}

fs.writeFileSync(sourcePath, content);
console.log('Successfully injected badges into Sidebar!');
