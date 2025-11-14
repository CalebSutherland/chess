import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Chess from "./components/Chess";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Chess />
    </QueryClientProvider>
  );
}

export default App;
