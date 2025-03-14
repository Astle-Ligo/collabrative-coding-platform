import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useParams } from "react-router-dom";
import CodeEditor from "./components/codeEditor";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/editor/:roomId" element={<CodeEditorWrapper />} />
      </Routes>
    </Router>
  );
};

const CodeEditorWrapper = () => {
  const { roomId } = useParams();
  console.log("🛠️ useParams() extracted roomId:", roomId);

  return <CodeEditor roomId={roomId} />;
};

export default App;
