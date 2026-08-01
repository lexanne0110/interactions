import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { assetUrl } from './lib/assetUrl';
import './index.css';

document.documentElement.style.setProperty(
  '--asset-sidebar-selected-chrome',
  `url(${assetUrl('/assets/category-listing/sidebar/thumbs/selected-chrome.png')})`,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
