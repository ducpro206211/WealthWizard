import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { useEffect } from "react";

// Add roboto material icons
function setupExternalResources() {
  // Add Material Icons
  const materialIcons = document.createElement("link");
  materialIcons.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
  materialIcons.rel = "stylesheet";
  document.head.appendChild(materialIcons);
  
  // Add Inter and Robot Mono fonts
  const fonts = document.createElement("link");
  fonts.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto+Mono&display=swap";
  fonts.rel = "stylesheet";
  document.head.appendChild(fonts);
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    setupExternalResources();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
