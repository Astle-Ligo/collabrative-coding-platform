import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { lazy, Suspense } from "react";

const CodeEditor = lazy(() => import("./components/codeEditor"));

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<h1>Welcome to the Collaborative Editor</h1>} />
        <Route
          path="/editor/:roomId"
          element={
            <Suspense fallback={<h2>Loading Editor...</h2>}>
              <CodeEditorWrapper />
            </Suspense>
          }
        />
        <Route path="*" element={<h2>404 - Page Not Found</h2>} />
      </Routes>
    </Router>
  );
};

const CodeEditorWrapper = () => {
  const { roomId } = useParams();

  if (!roomId) {
    return <h2>Invalid Room ID. Please check your URL.</h2>;
  }

  console.log("🛠️ useParams() extracted roomId:", roomId);

  return <CodeEditor roomId={roomId} />;
};

export default App;
