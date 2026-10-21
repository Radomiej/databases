import { startLabAnalytics } from './services/labAnalytics.js';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import App from './App.jsx';
import AssignmentRoot from './components/AssignmentRoot.jsx';
import './styles/app.css';

startLabAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <AssignmentRoot appId="databases"><App /></AssignmentRoot>,
);
