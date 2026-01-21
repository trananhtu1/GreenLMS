import { Col, Row } from "antd";
import clsx from "clsx";
import React from "react";

interface FilterGridProps {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
  gutter?: [number, number];
  xs?: number;
  sm?: number;
  xl?: number;
}

const FilterGrid = ({
  children,
  className = "",
  gutter = [16, 16],
  xs = 24,
  sm = 12,
  xl = 6,
}: FilterGridProps) => {
  const flattenedChildren = React.Children.toArray(children); // Flatten children

  return (
    <div className={clsx(className)}>
      <Row gutter={gutter}>
        {flattenedChildren.map((child, index) => (
          <Col key={index} xs={xs} sm={sm} xl={xl}>
            {child}
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default FilterGrid;
