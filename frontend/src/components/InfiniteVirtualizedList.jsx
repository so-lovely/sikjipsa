import React, { useMemo, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Box, Loader, Center } from '@mantine/core';

const InfiniteVirtualizedList = ({ 
  items, 
  itemHeight = 100, 
  renderItem,
  loadMoreItems,
  hasMore = true,
  isLoading = false,
  height = '50vh',
  overscanCount = 5,
  ...props 
}) => {
  const listRef = useRef();
  
  const itemCount = hasMore ? items.length + 1 : items.length;
  
  const isItemLoaded = (index) => !!items[index];
  
  const ItemRenderer = ({ index, style }) => {
    const isLast = index === items.length;
    
    if (isLast) {
      return (
        <div style={style}>
          <Center py="md">
            {isLoading ? (
              <Loader color="green" size="sm" />
            ) : (
              <Box style={{ height: '1rem' }} />
            )}
          </Center>
        </div>
      );
    }
    
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
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
            threshold={5}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={(list) => {
                  ref(list);
                  listRef.current = list;
                }}
                height={autoHeight}
                width={width}
                itemCount={itemCount}
                itemSize={itemHeight}
                onItemsRendered={onItemsRendered}
                overscanCount={overscanCount}
                style={{
                  scrollbarWidth: 'thin',
                }}
              >
                {ItemRenderer}
              </List>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    </Box>
  );
};

export default InfiniteVirtualizedList;