import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import Navigation from "@/components/navigation";
import Today from "@/pages/today";
import Calendar from "@/pages/calendar";
import Stats from "@/pages/stats";
import { useState } from "react";
import { AddHabitModal } from "@/components/add-habit-modal";

function Router() {
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Header onAddHabit={() => setIsAddHabitModalOpen(true)} />
      <Navigation />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Switch>
          <Route path="/" component={Today} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/stats" component={Stats} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <AddHabitModal 
        open={isAddHabitModalOpen} 
        onOpenChange={setIsAddHabitModalOpen} 
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
