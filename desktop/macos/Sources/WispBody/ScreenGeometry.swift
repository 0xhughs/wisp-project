import Foundation
import CoreGraphics
enum ScreenGeometry {
    static func clamp(_ body:CGRect,to screens:[CGRect]) -> CGRect {
        guard let screen=screens.min(by:{distance(body,$0)<distance(body,$1)}) else { return body }
        return CGRect(x:max(screen.minX,min(body.minX,screen.maxX-body.width)),y:max(screen.minY,min(body.minY,screen.maxY-body.height)),width:body.width,height:body.height)
    }
    private static func distance(_ a:CGRect,_ b:CGRect) -> CGFloat {
        let x=max(b.minX-a.midX,0,a.midX-b.maxX), y=max(b.minY-a.midY,0,a.midY-b.maxY)
        return x*x+y*y
    }
}
