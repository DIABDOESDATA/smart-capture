package com.diabdoesdata.smartcapture

import android.content.Context
import android.graphics.*
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel

class VehicleDetector(context:Context,private val result:(VehicleBox?)->Unit):ImageAnalysis.Analyzer,AutoCloseable {
    private val interpreter:Interpreter
    private var last=0L
    private val input=ByteBuffer.allocateDirect(320*320*3).order(ByteOrder.nativeOrder())
    private val target=Bitmap.createBitmap(320,320,Bitmap.Config.ARGB_8888)
    private val pixels=IntArray(320*320)
    private val boxes=Array(1){Array(25){FloatArray(4)}}
    private val classes=Array(1){FloatArray(25)}
    private val scores=Array(1){FloatArray(25)}
    private val count=FloatArray(1)
    private val outputs=mapOf<Int,Any>(0 to boxes,1 to classes,2 to scores,3 to count)
    init {
        val buffer=context.assets.openFd("models/vehicle-detection.tflite").use { fd ->
            java.io.FileInputStream(fd.fileDescriptor).channel.use { it.map(FileChannel.MapMode.READ_ONLY,fd.startOffset,fd.declaredLength) }
        }
        interpreter=Interpreter(buffer,Interpreter.Options().setNumThreads(2))
        interpreter.allocateTensors()
        require(interpreter.getInputTensor(0).shape().contentEquals(intArrayOf(1,320,320,3)))
        require(interpreter.getOutputTensor(0).shape().contentEquals(intArrayOf(1,25,4))) { "Unsupported detector output contract" }
    }
    override fun analyze(image:ImageProxy) {
        var full:Bitmap?=null;var upright:Bitmap?=null
        try {
            val now=android.os.SystemClock.elapsedRealtime()
            if(now-last<250)return
            last=now
            full=image.toBitmap()
            val r=image.cropRect
            val transform=Matrix().apply { postRotate(image.imageInfo.rotationDegrees.toFloat()) }
            upright=Bitmap.createBitmap(full,r.left,r.top,r.width(),r.height(),transform,true)
            val w=upright.width.toFloat();val h=upright.height.toFloat()
            val scale=minOf(320f/w,320f/h);val dx=(320-w*scale)/2;val dy=(320-h*scale)/2
            Canvas(target).apply { drawColor(Color.BLACK);drawBitmap(upright,null,RectF(dx,dy,dx+w*scale,dy+h*scale),Paint(Paint.FILTER_BITMAP_FLAG)) }
            target.getPixels(pixels,0,320,0,0,320,320);input.rewind()
            pixels.forEach { p -> input.put((p shr 16 and 255).toByte());input.put((p shr 8 and 255).toByte());input.put((p and 255).toByte()) }
            input.rewind();interpreter.runForMultipleInputsOutputs(arrayOf(input),outputs)
            val candidate=(0 until count[0].toInt().coerceIn(0,25)).filter { classes[0][it].toInt() in setOf(2,5,7) && scores[0][it]>=.65f }
                .maxByOrNull { scores[0][it] }
            val box=candidate?.let { i -> val b=boxes[0][i]
                VehicleBox(((b[1]*320-dx)/(w*scale)).coerceIn(0f,1f),((b[0]*320-dy)/(h*scale)).coerceIn(0f,1f),
                    ((b[3]*320-dx)/(w*scale)).coerceIn(0f,1f),((b[2]*320-dy)/(h*scale)).coerceIn(0f,1f),scores[0][i],now)
            }
            result(box)
        } catch(_:Exception) { result(null) }
        finally { if(upright!=null && upright!==full)upright.recycle();full?.recycle();image.close() }
    }
    override fun close(){interpreter.close();target.recycle()}
}
