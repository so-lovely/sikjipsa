import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Box } from '@mantine/core';

const VirtualizedList = ({ 
  items, 
  itemHeight = 100, 
  renderItem, 
  height = '50vh',
  overscanCount = 5,
  ...props 
}) => {
  const itemData = useMemo(() => ({ items, renderItem }), [items, renderItem]);

  const ItemRenderer = ({ index, style, data }) => {
    const { items, renderItem } = data;
    const item = items[index];
    
    return (
      <div style={style}>
        <Box px="sm" py="xs" style={{ height: '100%' }}>
          {renderItem(item, index)}
        </Box>
      </div>
    );
  };

  return (
    <Box 
      style={{ 
        height, 
        width: '100%',
        minHeight: '20vh',
        maxHeight: '80vh'
      }} 
      {...props}
    >
      <AutoSizer>
        {({ height: autoHeight, width }) => (
          <List
            height={autoHeight}
            width={width}
            itemCount={items.length}
            itemSize={itemHeight}
            itemData={itemData}
            overscanCount={overscanCount}
            style={{
              scrollbarWidth: 'thin',
            }}
          >
            {ItemRenderer}
          </List>
        )}
      </AutoSizer>
    </Box>
  );
};

export default VirtualizedList;