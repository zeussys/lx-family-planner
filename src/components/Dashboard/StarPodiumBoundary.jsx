import { Component } from 'react';
import StarPodium from './StarPodium';

// Schuetzt die Dashboards: ein Fehler im Podium blockiert nie die ganze Seite.
export default class StarPodiumBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Sterne-Podium konnte nicht geladen werden:', error);
  }

  render() {
    if (this.state.failed) return null;
    return <StarPodium {...this.props} />;
  }
}
