import React from 'react';

import Tab from './Tab';

const Tabs = ({ children, activeTab, setActiveTab }) => {
  // Filter out null/undefined children
  const validChildren = React.Children.toArray(children).filter((child) => child != null);
  
  return (
    <div className="tabs">
      <ol className="tab-list">
        {validChildren.map((child) => {
          if (!child || !child.props) {
            return null;
          }
          const { label } = child.props;

          return (
            <Tab
              active={activeTab === label}
              key={label}
              label={label}
              onClick={(tab) => setActiveTab(tab)}
            />
          );
        })}
      </ol>
      <div className="tab-content">
        {validChildren.map((child) => {
          if (!child || !child.props || child.props.label !== activeTab) {
            return null;
          }
          return child.props.children;
        })}
      </div>
    </div>
  );
};

export default Tabs;
