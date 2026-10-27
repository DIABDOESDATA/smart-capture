package com.diabdoesdata.smartcapture

import kotlin.math.abs

data class VehicleBox(val left:Float,val top:Float,val right:Float,val bottom:Float,val confidence:Float,val at:Long) {
    val width get()=right-left
    val height get()=bottom-top
    fun usable()=listOf(left,top,right,bottom,confidence).all { it.isFinite() } && width>.05f && height>.05f && left>=0 && top>=0 && right<=1 && bottom<=1 && confidence>=.65f
}

/** Whole-vehicle framing only. This does not estimate viewing angle or physical distance. */
class GuidanceFilter {
    private var context=""
    private var box:VehicleBox?=null
    private var streak=0
    fun reset(key:String){context=key;box=null;streak=0}
    fun update(key:String,value:VehicleBox?,now:Long):VehicleBox? {
        if(key!=context) return null
        if(value==null || !value.usable() || now-value.at !in 0..1200) { box=null;streak=0;return null }
        val old=box
        // A different detected subject must establish confidence again.
        if(old!=null && (abs(old.left-value.left)>.2f || abs(old.top-value.top)>.2f)) streak=0
        val a=.35f
        box=if(old==null || streak==0)value else VehicleBox(old.left*(1-a)+value.left*a,old.top*(1-a)+value.top*a,old.right*(1-a)+value.right*a,old.bottom*(1-a)+value.bottom*a,value.confidence,value.at)
        streak++
        return if(streak>=3)box else null
    }
    fun instruction(value:VehicleBox?,now:Long):String {
        if(value==null || now-value.at !in 0..1500)return "Use the photo guide to frame the vehicle"
        return when {
            value.left<.035f || value.right>.965f || value.top<.035f || value.bottom>.965f -> "Step back — leave space around the vehicle"
            value.width<.48f && value.height<.48f -> "Move closer — fill more of the frame"
            (value.left+value.right)/2<.43f -> "Aim a little left to center the vehicle"
            (value.left+value.right)/2>.57f -> "Aim a little right to center the vehicle"
            (value.top+value.bottom)/2<.4f -> "Aim a little higher to center the vehicle"
            (value.top+value.bottom)/2>.6f -> "Aim a little lower to center the vehicle"
            else -> "Framing looks balanced — check the photo guide"
        }
    }
}
