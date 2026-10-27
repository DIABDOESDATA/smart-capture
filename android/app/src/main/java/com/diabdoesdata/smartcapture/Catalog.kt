package com.diabdoesdata.smartcapture

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapRegionDecoder
import android.graphics.Matrix
import android.graphics.Rect
import android.util.LruCache
import org.json.JSONObject
import java.io.File

data class Guide(val path: String, val rect: List<Int>, val mirror: Boolean)
data class Shot(val code: String, val name: String, val category: String, val instruction: String,
    val detectorEligible: Boolean, val azimuth: Double?, val panelState: String,
    val bodies: List<String>, val references: Map<String, Guide>)

class Catalog(private val context: Context) {
    private val root = JSONObject(context.assets.open("catalog.v3.json").bufferedReader().use { it.readText() })
    val revision: String = root.getString("revision")
    val shots: List<Shot> = root.getJSONArray("shots").let { list ->
        (0 until list.length()).map { i ->
            val s = list.getJSONObject(i)
            val refs = s.getJSONObject("references")
            Shot(s.getString("code"), s.getString("name"), s.getString("category"), s.getString("instruction"),
                s.getBoolean("detectorEligible"), if (s.isNull("nominalAzimuthDegrees")) null else s.getDouble("nominalAzimuthDegrees"),
                s.getString("panelState"), s.getJSONArray("applicableBodies").let { b -> (0 until b.length()).map { b.getString(it) } },
                refs.keys().asSequence().associateWith { body ->
                    val r=refs.getJSONObject(body); val rect=r.getJSONArray("rect")
                    Guide(root.getJSONObject("assets").getJSONObject(r.getString("asset")).getString("path"),
                        (0..3).map { rect.getInt(it) }, r.getBoolean("mirror"))
                })
        }
    }
    fun shot(code: String) = shots.firstOrNull { it.code == code } ?: shots.first()
    fun sequence(body: String, extended: Boolean = false): List<String> = shots.filter {
        body in it.bodies && it.code != "ADDITIONAL_FREE" && (extended || it.code !in setOf("HOOD_OPEN", "ROOF_SUNROOF", "CONVERTIBLE_ROOF_UP"))
    }.map { it.code }

    private val cache = object : LruCache<String, Bitmap>(20 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap) = value.allocationByteCount
    }
    @Synchronized fun bitmap(shot: Shot, body: String): Bitmap {
        val guide = shot.references[body] ?: shot.references.getValue("sedan")
        val key = "$body:${shot.code}"
        cache.get(key)?.let { return it }
        val bitmap = context.assets.open(guide.path).use { input ->
            @Suppress("DEPRECATION") val decoder = BitmapRegionDecoder.newInstance(input, false)
            requireNotNull(decoder)
            val (x,y,w,h) = guide.rect
            try { decoder.decodeRegion(Rect(x,y,x+w,y+h), BitmapFactory.Options().apply {
                inPreferredConfig = Bitmap.Config.ARGB_8888
                inSampleSize = if (maxOf(w,h)>1600) 2 else 1
            }) } finally { decoder.recycle() }
        }
        val result = if (guide.mirror) Bitmap.createBitmap(bitmap,0,0,bitmap.width,bitmap.height,Matrix().apply { setScale(-1f,1f) },true).also { bitmap.recycle() } else bitmap
        cache.put(key,result)
        return result
    }
}

data class Calibration(val opacity: Float=.32f,val scale: Float=1f,val x: Float=0f,val y: Float=0f,val mirror:Boolean=false,
    val cropLeft:Float=0f,val cropTop:Float=0f,val cropRight:Float=1f,val cropBottom:Float=1f,val ovalMask:Boolean=false) {
    fun json()=JSONObject().put("opacity",opacity).put("scale",scale).put("x",x).put("y",y).put("mirror",mirror)
        .put("cropLeft",cropLeft).put("cropTop",cropTop).put("cropRight",cropRight).put("cropBottom",cropBottom).put("ovalMask",ovalMask).toString()
    companion object { fun parse(value:String?):Calibration = runCatching {
        val j=JSONObject(value ?: "{}");Calibration(j.optDouble("opacity",.32).toFloat(),j.optDouble("scale",1.0).toFloat(),j.optDouble("x",0.0).toFloat(),j.optDouble("y",0.0).toFloat(),j.optBoolean("mirror"),j.optDouble("cropLeft",0.0).toFloat(),j.optDouble("cropTop",0.0).toFloat(),j.optDouble("cropRight",1.0).toFloat(),j.optDouble("cropBottom",1.0).toFloat(),j.optBoolean("ovalMask"))
    }.getOrDefault(Calibration()) }
}

fun boundedReference(file: File): Bitmap {
    val bounds=BitmapFactory.Options().apply { inJustDecodeBounds=true }
    BitmapFactory.decodeFile(file.path,bounds)
    require(bounds.outWidth>0 && bounds.outHeight>0) { "Choose a readable photograph" }
    var sample=1
    while(maxOf(bounds.outWidth,bounds.outHeight)/sample>1600) sample*=2
    val bitmap=BitmapFactory.decodeFile(file.path,BitmapFactory.Options().apply { inSampleSize=sample }) ?: error("Cannot read reference")
    val exif=androidx.exifinterface.media.ExifInterface(file)
    val m=Matrix()
    when(exif.getAttributeInt(androidx.exifinterface.media.ExifInterface.TAG_ORIENTATION,1)) {
        2->m.setScale(-1f,1f);3->m.setRotate(180f);4->m.setScale(1f,-1f)
        5->{m.setRotate(90f);m.postScale(-1f,1f)};6->m.setRotate(90f)
        7->{m.setRotate(270f);m.postScale(-1f,1f)};8->m.setRotate(270f)
    }
    return if(m.isIdentity) bitmap else Bitmap.createBitmap(bitmap,0,0,bitmap.width,bitmap.height,m,true).also { bitmap.recycle() }
}
