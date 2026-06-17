import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Models from './pages/Models';
import ModelForm from './pages/ModelForm';
import Templates from './pages/Templates';
import TemplateEditor from './pages/TemplateEditor';
import Evaluations from './pages/Evaluations';
import EvaluationEditor from './pages/EvaluationEditor';
import EvaluationReport from './pages/EvaluationReport';
import Logs from './pages/Logs';
import Playground from './pages/Playground';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="models" element={<Models />} />
          <Route path="models/new" element={<ModelForm />} />
          <Route path="models/:id/edit" element={<ModelForm />} />
          <Route path="templates" element={<Templates />} />
          <Route path="templates/new" element={<TemplateEditor />} />
          <Route path="templates/:id" element={<TemplateEditor />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="evaluations/:templateId" element={<EvaluationEditor />} />
          <Route path="evaluations/:templateId/report" element={<EvaluationReport />} />
          <Route path="logs" element={<Logs />} />
          <Route path="playground" element={<Playground />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
