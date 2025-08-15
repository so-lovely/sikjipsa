import React, { useState, useRef, useEffect } from 'react';
import { Loader, Center } from '@mantine/core';

const LazyLoad = ({ 
  children, 
  height = 200, 
  placeholder = null, 
  threshold = 0.1,
  rootMargin = '50px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.unobserve(ref.current);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin, hasLoaded]);

  const defaultPlaceholder = (
    <Center style={{ height }}>
      <Loader color="green" size="sm" />
    </Center>
  );

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {isVisible ? children : (placeholder || defaultPlaceholder)}
    </div>
  );
};

export default LazyLoad;