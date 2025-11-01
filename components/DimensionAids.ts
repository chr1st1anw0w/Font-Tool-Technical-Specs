// components/DimensionAids.ts
import paper from 'paper';

type LinearDimension = {
    type: 'linear';
    axis: 'x' | 'y';
    geoKey: string;
    edge1: 'left' | 'right' | 'top' | 'bottom';
    edge2: 'left' | 'right' | 'top' | 'bottom';
    position: number;
    offset: number;
    paramKey: string;
    anchor: 'left' | 'right' | 'top' | 'bottom';
};

type SpacingDimension = {
    type: 'spacing';
    axis: 'y';
    geoKey1: string;
    edge1: 'bottom';
    geoKey2: string;
    edge2: 'top';
    position: number;
    offset: number;
    paramKey: string;
};

type RadiusDimension = {
    type: 'radius';
    geoKey: string;
    corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
    label: string;
    offset: paper.Point;
    paramKey: string;
};

type Dimension = LinearDimension | SpacingDimension | RadiusDimension;

const dimensionData: { [key: string]: Dimension[] } = {
    'S': [
        // Widths
        { type: 'linear', axis: 'x', geoKey: 's-top-bar', edge1: 'left', edge2: 'right', position: 0, offset: -40, paramKey: 's-top-bar-width', anchor: 'left' },
        { type: 'linear', axis: 'x', geoKey: 's-bottom-bar', edge1: 'left', edge2: 'right', position: 706, offset: 40, paramKey: 's-bottom-bar-width', anchor: 'left' },
        
        // Heights
        { type: 'linear', axis: 'y', geoKey: 's-top-bar', edge1: 'top', edge2: 'bottom', position: 601, offset: 40, paramKey: 's-top-bar-height', anchor: 'top' },
        { type: 'linear', axis: 'y', geoKey: 's-left-stem', edge1: 'top', edge2: 'bottom', position: 35, offset: -40, paramKey: 's-left-stem-height', anchor: 'top' },
        { type: 'linear', axis: 'y', geoKey: 's-right-stem', edge1: 'top', edge2: 'bottom', position: 616, offset: 40, paramKey: 's-right-stem-height', anchor: 'bottom' },
        { type: 'linear', axis: 'y', geoKey: 's-bottom-bar', edge1: 'top', edge2: 'bottom', position: 35, offset: -40, paramKey: 's-bottom-bar-height', anchor: 'bottom' },

        // Spacing
        { type: 'spacing', axis: 'y', geoKey1: 's-top-bar', edge1: 'bottom', geoKey2: 's-mid-bar', edge2: 'top', position: 35, offset: -40, paramKey: 's-mid-bar-spacing-top' },
    ]
};

const styles = {
    lineColor: '#EF5533',
    lineWidth: 1,
    textColor: '#EF5533',
    textSize: 10,
    arrowSize: 6,
    textOffset: 15
};

export function drawDimensionAids(scope: any, letterKey: string, geometryMap: Map<string, any>): any {
    const { Point, Path, PointText, Color } = scope;
    
    const dimensions = dimensionData[letterKey];
    if (!dimensions || !Array.isArray(dimensions)) return null;

    const group = new scope.Group();
    group.name = 'dimension-aids';

    dimensions.forEach((dim: Dimension) => {
        if (dim.type === 'linear') {
            const linearDim = dim as LinearDimension;
            const item = geometryMap.get(linearDim.geoKey);
            if (!item) return;

            const bounds = item.bounds;
            let p1: any, p2: any;

            if (linearDim.axis === 'x') {
                p1 = new Point(bounds[linearDim.edge1], bounds.top + linearDim.position);
                p2 = new Point(bounds[linearDim.edge2], bounds.top + linearDim.position);
            } else {
                p1 = new Point(bounds.left + linearDim.position, bounds[linearDim.edge1]);
                p2 = new Point(bounds.left + linearDim.position, bounds[linearDim.edge2]);
            }

            const lineP1 = p1.add(linearDim.axis === 'x' ? new Point(0, linearDim.offset) : new Point(linearDim.offset, 0));
            const lineP2 = p2.add(linearDim.axis === 'x' ? new Point(0, linearDim.offset) : new Point(linearDim.offset, 0));

            // Main dimension line
            const mainLine = new Path.Line(lineP1, lineP2);
            mainLine.strokeColor = new Color(styles.lineColor);
            mainLine.strokeWidth = styles.lineWidth;

            // Extension lines
            const ext1 = new Path.Line(p1, lineP1);
            ext1.strokeColor = new Color(styles.lineColor);
            ext1.strokeWidth = styles.lineWidth;

            const ext2 = new Path.Line(p2, lineP2);
            ext2.strokeColor = new Color(styles.lineColor);
            ext2.strokeWidth = styles.lineWidth;

            // Arrows
            const arrowSize = styles.arrowSize;
            const arrow1 = new Path([
                lineP1.add(linearDim.axis === 'x' ? new Point(arrowSize, -arrowSize/2) : new Point(-arrowSize/2, arrowSize)),
                lineP1.add(linearDim.axis === 'x' ? new Point(arrowSize, arrowSize/2) : new Point(arrowSize/2, arrowSize))
            ]);
            arrow1.strokeColor = new Color(styles.lineColor);
            arrow1.strokeWidth = styles.lineWidth;

            const arrow2 = new Path([
                lineP2.add(linearDim.axis === 'x' ? new Point(-arrowSize, -arrowSize/2) : new Point(-arrowSize/2, -arrowSize)),
                lineP2.add(linearDim.axis === 'x' ? new Point(-arrowSize, arrowSize/2) : new Point(arrowSize/2, -arrowSize))
            ]);
            arrow2.strokeColor = new Color(styles.lineColor);
            arrow2.strokeWidth = styles.lineWidth;

            // Text
            const distance = Math.abs(linearDim.axis === 'x' ? p2.x - p1.x : p2.y - p1.y);
            const text = new PointText({
                content: Math.round(distance).toString(),
                fillColor: new Color(styles.textColor),
                fontSize: styles.textSize,
                justification: 'center'
            });

            const center = lineP1.add(lineP2).divide(2);
            text.position = center.add(linearDim.axis === 'x' ? new Point(0, -15) : new Point(-15, 0));

            // Store metadata for interaction
            const dimGroup = new scope.Group([mainLine, ext1, ext2, arrow1, arrow2, text]);
            dimGroup.data = {
                paramKey: linearDim.paramKey,
                geoKey: linearDim.geoKey,
                currentValue: Math.round(distance),
                anchor: linearDim.anchor
            };

            group.addChild(dimGroup);
        }
        
        // Handle spacing and radius dimensions similarly...
        // Simplified for now to avoid type errors
    });

    return group;
}