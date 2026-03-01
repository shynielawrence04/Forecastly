import Weather from "./components/Weather";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>Forecastly</h1>
        <p>Real-time weather insights, beautifully delivered.</p>
      </header>

      <main className="app__main">
        <Weather />
      </main>

      <footer className="app__footer">
        <small>Data by OpenWeatherMap • Built with React + Axios</small>
      </footer>
    </div>
  );
}