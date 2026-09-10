import Foundation
import CoreGraphics
func screenGeometryTests() throws {
    let negative=CGRect(x:-1600,y:100,width:1600,height:900)
    let body=CGRect(x:-1200,y:300,width:160,height:160)
    try check(ScreenGeometry.clamp(body,to:[negative]) == body,"negative display coordinates")
    let remaining=CGRect(x:0,y:40,width:900,height:700)
    try check(remaining.contains(ScreenGeometry.clamp(body,to:[remaining])),"removed display recovery")
    let top=CGRect(x:0,y:1000,width:900,height:700)
    try check(ScreenGeometry.clamp(CGRect(x:500,y:1500,width:160,height:160),to:[remaining,top]).minY == 1500,"vertically arranged displays")
}
