/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import axios from 'axios';
import { sortBy } from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './App.css';

const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP = '100';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse()
};

class App extends Component {

  constructor(props) {
    super(props);

    this._isMounted = false;

    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading: false,
    };

    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
  }

  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }

  setSearchTopStories(result) {
    const { hits, page } = result;

    // use function to set state to prevent bugs due to stale state
    // setState() is asynchronous
    this.setState(updateSearchTopStoriesState(hits, page));
  }

  fetchSearchTopStories(searchTerm, page = 0) {
    this.setState({ isLoading: true });

    axios(
      `${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}
        &${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`
    )
      // avoid warning when promise (from fetch) is acted upon when 
      // component is unmounted
      .then(result => this._isMounted && this.setSearchTopStories(result.data))
      .catch(error => this._isMounted && this.setState({ error }));
  }

  // lifecycle method like constructor() and render(), from Component
  componentDidMount() {
    this._isMounted = true;
    const { searchTerm } = this.state;

    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(searchTerm);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });

    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }
    // prevent browser from reloading every time search is submitted
    event.preventDefault();
  }

  onDismiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    // Object.assign() merges into the first argument the trailing arguments
    // Thus, none of the trailing source objects are mutated.
    // Alternatively, we can use the object spread operator:
    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      }
    });
  }

  render() {
    const {
      searchTerm,
      results,
      searchKey,
      error,
      isLoading
    } = this.state;

    // page (number) defaults to 0, check from past searches
    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
    ) || 0;

    // search hits list defaults to empty, check from past searches
    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || [];

    return (
      <div className="page">
        <div className="title">
          a-hacker-news-client
        </div>
        <div className="interactions">
          <Search
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
          >
            Search
          </Search>
          {error
            ? <div className="interactions">
              <p>Something went wrong.</p>
            </div>
            : <Table
              list={list}
              onDismiss={this.onDismiss}
            />
          }
          <div className="interactions">
            <ButtonWithLoading
              isLoading={isLoading}
              onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
              More
            </ButtonWithLoading>
          </div>
        </div>
      </div>
    );
  }
}

const updateSearchTopStoriesState = (hits, page) => (prevState) => {
  const { searchKey, results } = prevState;

  // store current search result (if any), from the client-side cache
  const oldHits = results && results[searchKey]
    ? results[searchKey].hits
    : [];

  // add on new search hits to old search hits
  const updatedHits = [
    ...oldHits,
    ...hits
  ];

  // remember page: page can be written as just page
  // note ES6 computed property syntax
  // this adds on the current searched result to list of past searches
  return {
    results: {
      ...results,
      [searchKey]: { hits: updatedHits, page }
    },
    isLoading: false
  };
};

const Loading = () =>
  <div>Loading...</div>

const withLoading = (Component) => ({ isLoading, ...rest }) =>
  isLoading
    ? <Loading />
    : <Component {...rest} />

const Search = ({
  onSubmit,
  value,
  onChange,
  children
}) =>
  <form onSubmit={onSubmit}>
    <input
      type="text"
      value={value}
      onChange={onChange}
    />
    <button type="submit">
      {children}
    </button>
  </form>

Search.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node
};

const Sort = ({
  sortKey,
  activeSortKey,
  onSort,
  children
}) => {
  const sortClass = classNames(
    'button-inline',
    { 'button-active': sortKey === activeSortKey }
  );

  return (
    <Button
      onClick={() => onSort(sortKey)}
      className={sortClass}
    >
      {children}
    </Button>
  );
};

class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sortKey: 'NONE',
      isSortReverse: false
    };

    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey) {
    // sorting by the same key twice in a row reverses the sort
    const isSortReverse = this.state.sortKey === sortKey &&
      !this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse });
  }

  render() {
    const {
      list,
      onDismiss
    } = this.props;

    const {
      sortKey,
      isSortReverse,
    } = this.state;

    const sortedList = SORTS[sortKey](list);
    const reverseSortedList = isSortReverse
      ? sortedList.reverse()
      : sortedList;
    return (
      <div className="table">
        <div className="table-header">
          <span style={{ width: '40%' }}>
            <Sort
              sortKey={'TITLE'}
              onSort={this.onSort}
              activeSortKey={sortKey}
            >
              Title
              </Sort>
          </span>
          <span style={{ width: '30%' }}>
            <Sort
              sortKey={'AUTHOR'}
              onSort={this.onSort}
              activeSortKey={sortKey}
            >
              Author
              </Sort>
          </span>
          <span style={{ width: '10%' }}>
            <Sort
              sortKey={'COMMENTS'}
              onSort={this.onSort}
              activeSortKey={sortKey}
            >
              Comments
              </Sort>
          </span>
          <span style={{ width: '10%' }}>
            <Sort
              sortKey={'POINTS'}
              onSort={this.onSort}
              activeSortKey={sortKey}
            >
              Points
              </Sort>
          </span>
          <span style={{ width: '10%' }}>
            Archive
            </span>
        </div>
        {reverseSortedList.map(item =>
          <div key={item.objectID} className="table-row">
            <span style={{ width: '40%' }}>
              <a href={item.url}>{item.title}</a>
            </span>
            <span style={{ width: '30%' }}>
              {item.author}
            </span>
            <span style={{ width: '10%' }}>
              {item.num_comments}
            </span>
            <span style={{ width: '10%' }}>
              {item.points}
            </span>
            <span style={{ width: '10%' }}>
              <Button
                onClick={() => onDismiss(item.objectID)}
                className="button-inline"
              >
                Dismiss
                </Button>
            </span>
          </div>
        )}
      </div>
    );
  }
}

Table.propTypes = {
  list: PropTypes.array.isRequired,
  onDismiss: PropTypes.func.isRequired
};

const Button = ({ onClick, className, children }) =>
  <button
    onClick={onClick}
    className={className}
    type="button"
  >
    {children}
  </button>

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

Button.defaultProps = {
  className: ''
};

const ButtonWithLoading = withLoading(Button);

export default App;

export {
  Button,
  Search,
  Table
};