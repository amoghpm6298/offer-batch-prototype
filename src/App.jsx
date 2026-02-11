import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BaseBatchView from './pages/BaseBatchView';
import CreateOfferBatch from './pages/CreateOfferBatch';
import OfferBatchDetail from './pages/OfferBatchDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BaseBatchView />} />
        <Route path="/create-campaign" element={<CreateOfferBatch />} />
        <Route path="/campaign/:id" element={<OfferBatchDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
