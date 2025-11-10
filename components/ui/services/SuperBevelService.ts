import paper from 'paper';
import { TransformParams, BevelType } from './types';

enum CornerType {
  CONVEX = 'convex',   // 陽角
  CONCAVE = 'concave', // 陰角
  STRAIGHT = 'straight'
}

export class SuperBevelService {
    private scope: paper.PaperScope;

    constructor(scope: paper.PaperScope) {
        this.scope = scope;
    }

    private detectCornerType(segment: paper.Segment): CornerType {
        if (!segment.previous || !segment.next) return CornerType.STRAIGHT;

        const v1 = segment.point.subtract(segment.previous.point);
        const v2 = segment.next.point.subtract(segment.point);

        const crossProduct = v1.cross(v2);

        if (Math.abs(crossProduct) < 1e-6) {
             return CornerType.STRAIGHT;
        }
        
        return crossProduct < 0 ? CornerType.CONVEX : CornerType.CONCAVE;
    }

    public apply(path: paper.Path, originalId: number, params: TransformParams, nodeOverrides: Map<string, Partial<TransformParams>>): paper.Path {
        let beveledPath : paper.PathItem = path.clone({ insert: false });
        
        const concaveInsets: paper.Path[] = [];
        path.segments.forEach(segment => {
            const segmentId = `${originalId}-${segment.index}`;
            const override = nodeOverrides.get(segmentId);
            
            const bevelType = override?.bevelType ?? params.bevelType;
            if (override && bevelType === BevelType.NONE) return;

            const bevelSize = override?.bevelSize ?? params.bevelSize;
            if (bevelType === BevelType.NONE || bevelSize <= 0) return;

            const cornerType = this.detectCornerType(segment);
            if (cornerType === CornerType.CONCAVE) {
                const insetShape = this.createConcaveInset(segment, bevelSize, bevelType);
                if (insetShape) {
                    concaveInsets.push(insetShape);
                }
            }
        });

        if (concaveInsets.length > 0) {
            let tempPath: paper.PathItem = beveledPath;
            concaveInsets.forEach(inset => {
                tempPath = tempPath.subtract(inset, { insert: false });
                inset.remove();
            });
            beveledPath = tempPath;
        }
        
        const globalBevelType = params.bevelType;

        if ((globalBevelType === BevelType.FILLET || globalBevelType === BevelType.CHAMFER || nodeOverrides.size > 0) && beveledPath instanceof this.scope.Path) {
            const newPath = new this.scope.Path({insert: false});
            const pathRef = beveledPath as paper.Path;

            pathRef.curves.forEach((curve: paper.Curve, index: number) => {
                const segment = curve.segment1;
                const segmentId = `${originalId}-${segment.index}`;
                const override = nodeOverrides.get(segmentId);
                
                const bevelType = override?.bevelType ?? globalBevelType;
                const bevelSize = override?.bevelSize ?? params.bevelSize;

                const cornerType = this.detectCornerType(segment);
                
                if (index === 0) newPath.moveTo(curve.point1);

                if (cornerType === CornerType.CONVEX && bevelSize > 0 && (bevelType === BevelType.FILLET || bevelType === BevelType.CHAMFER)) {
                    const offset = Math.min(bevelSize, curve.length / 2, curve.previous.length / 2);
                    if (offset > 0) {
                        const from = curve.previous.getPointAt(curve.previous.length - offset);
                        const to = curve.getPointAt(offset);
                        
                        if (newPath.lastSegment) {
                           newPath.lastSegment.point = from;
                        }

                        if (bevelType === BevelType.FILLET) {
                            newPath.arcTo(segment.point, to);
                        } else if (bevelType === BevelType.CHAMFER) {
                            newPath.lineTo(to);
                        }
                    } else {
                        newPath.lineTo(segment.point);
                    }
                } else {
                    newPath.lineTo(segment.point);
                }
            });

            if(pathRef.closed) {
                const lastCurve = pathRef.curves[pathRef.curves.length - 1];
                const lastSegment = lastCurve.segment2;
                const segmentId = `${originalId}-${lastSegment.index}`;
                const override = nodeOverrides.get(segmentId);

                const bevelType = override?.bevelType ?? globalBevelType;
                const bevelSize = override?.bevelSize ?? params.bevelSize;

                 const cornerType = this.detectCornerType(lastSegment);
                  if (cornerType === CornerType.CONVEX && bevelSize > 0 && (bevelType === BevelType.FILLET || bevelType === BevelType.CHAMFER)) {
                     const offset = Math.min(bevelSize, lastCurve.length / 2, pathRef.curves[0].length / 2);
                      if (offset > 0) {
                        const from = lastCurve.getPointAt(lastCurve.length - offset);
                        if (newPath.lastSegment) newPath.lastSegment.point = from;
                        const to = pathRef.curves[0].getPointAt(offset);

                         if (bevelType === BevelType.FILLET) {
                            newPath.arcTo(lastSegment.point, to);
                        } else if (bevelType === BevelType.CHAMFER) {
                            newPath.lineTo(to);
                        }
                      }
                  }
                newPath.closed = true;
            }
            beveledPath.remove();
            beveledPath = newPath;
        }


        return beveledPath as paper.Path;
    }

    private createConcaveInset(segment: paper.Segment, size: number, type: BevelType): paper.Path | null {
        let inset: paper.Path;
        const point = segment.point;

        switch (type) {
            case BevelType.CONCAVE_SQUARE:
                inset = new this.scope.Path.Rectangle({
                    center: point,
                    size: [size, size],
                    insert: false,
                });
                break;
            case BevelType.CONCAVE_ROUND:
                inset = new this.scope.Path.Circle({
                    center: point,
                    radius: size / 2,
                    insert: false,
                });
                break;
            case BevelType.CONCAVE_CHAMFER:
                 inset = new this.scope.Path.Rectangle({
                    center: point,
                    size: [size, size],
                    insert: false,
                });
                inset.segments[0].point = inset.segments[0].point.add(new this.scope.Point(size / 4, 0));
                inset.segments[1].point = inset.segments[1].point.add(new this.scope.Point(0, size / 4));
                inset.segments[2].point = inset.segments[2].point.add(new this.scope.Point(-size / 4, 0));
                inset.segments[3].point = inset.segments[3].point.add(new this.scope.Point(0, -size / 4));
                break;
            default:
                return null;
        }

        if(segment.previous && segment.next) {
            const v1 = segment.previous.point.subtract(point).normalize();
            const v2 = segment.next.point.subtract(point).normalize();
            const angle = v1.getDirectedAngle(v2);
            inset.rotate(angle / 2, point);
        }

        return inset;
    }
}