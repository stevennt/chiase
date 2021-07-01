import './App.css';
import './index.css';
import configureFirebase from './config';
import { Switch, Route } from 'react-router-dom';
import Auth from './screens/Auth';
import Maintenance from './screens/Maintenance';
require('dotenv').config()
// configureFirebase();

// Main App Component
function App() {
  return (
    <div className="App">
        <Maintenance />
        {/* <Switch>
          <Route exact path='/login'>
            <Auth />
          </Route>
          <Route exact path='/' component={Auth} />
        </Switch> */}
    </div>
  );
}

export default App;