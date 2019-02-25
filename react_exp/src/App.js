import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>

            This part of the site is built using react
          </p>
          <a
            className="App-link"
            href="/"
            // target="_blank"
            rel="noopener noreferrer"
          >
            Get me outta here!
          </a>
        </header>
      </div>
    );
  }
}

export default App;
