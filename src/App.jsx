import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BaseBatchView from './pages/BaseBatchView';
import CreateIncentive from './pages/CreateIncentive';
import IncentiveDetail from './pages/IncentiveDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BaseBatchView />} />
        <Route path="/create-incentive" element={<CreateIncentive />} />
        <Route path="/incentive/:id" element={<IncentiveDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
