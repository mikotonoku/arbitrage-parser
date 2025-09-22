import { observer } from 'mobx-react-lite';
import React from 'react';
import SearchCoin from './components/searchCoin/searchCoin';

function App() {
  return (
    <>
      <SearchCoin/>
    </>
  );
}

export default observer(App);
