import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import App, { Search, Button, Table } from './App';

Enzyme.configure({ adapter: new Adapter() });

const NOOP = ()=>{};

// Tests with Jest
describe('App', () => {

  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<App />, div);
    ReactDOM.unmountComponentAtNode(div);
  });

  test('has a valid snapshot', () => {
    // create a snapshot of the App component, by rendering it visually and
    // storing the DOM
    const component = renderer.create(
      <App />
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

});

describe('Search', () => {

  const props = {
    onSubmit: NOOP,
    onChange: NOOP
  }

  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(
      <Search {...props}>
        Search
      </Search>,
    div);
    ReactDOM.unmountComponentAtNode(div);
  });

  test('has a valid snapshot', () => {
    // create a snapshot of the App component, by rendering it visually and
    // storing the DOM
    const component = renderer.create(
      <Search {...props}>Search</Search>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

});

describe('Button', () => {

  const props = {
    onClick: NOOP
  }

  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Button {...props}>Give Me More</Button>, div);
    ReactDOM.unmountComponentAtNode(div);
  });

  test('has a valid snapshot', () => {
    // create a snapshot of the App component, by rendering it virtually and
    // storing the DOM
    const component = renderer.create(
      <Button {...props}>Give Me More</Button>
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

});

describe('Table', () => {

  const props = {
    list: [
      { title: '1', author: '1', num_comments: 1, points: 2, objectID: 'y'},
      { title: '2', author: '2', num_comments: 1, points: 2, objectID: 'x'},
    ],
    onDismiss: NOOP,
    sortKey: 'TITLE',
    isSortReverse: false
  }

  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Table {...props} />, div);
    ReactDOM.unmountComponentAtNode(div);
  });

  test('has a valid snapshot', () => {
    // create a snapshot of the App component, by rendering it virtually and
    // storing the DOM
    const component = renderer.create(
      <Table {...props} />
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  // unit test
  it('shows two items in list', () => {
    // Enzyme's shallow() renders the component without its child components
    const element = shallow(
      <Table {...props} />
    )

    expect(element.find('.table-row').length).toBe(2);
  });

});