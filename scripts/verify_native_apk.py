"""Check the actual APK's bundled model/catalog and 16KB native-library packaging."""
import hashlib
import json
import struct
import sys
import zipfile
from pathlib import Path

apk=Path(sys.argv[1])
shared=Path(__file__).resolve().parents[1]/'shared'
libraries=[]
with zipfile.ZipFile(apk) as archive,apk.open('rb') as raw:
    for path in ['catalog.v3.json','models/vehicle-detection.tflite']:
        assert archive.read('assets/'+path)==(shared/path).read_bytes(),path
    assert archive.getinfo('assets/models/vehicle-detection.tflite').compress_type==zipfile.ZIP_STORED
    for item in archive.infolist():
        if not item.filename.startswith('lib/') or not item.filename.endswith('.so'):continue
        data=archive.read(item)
        assert data[:5]==b'\x7fELF\x02',item.filename
        offset=struct.unpack_from('<Q',data,32)[0]
        size,count=struct.unpack_from('<HH',data,54)
        alignments=[]
        for i in range(count):
            at=offset+i*size
            if struct.unpack_from('<I',data,at)[0]!=1:continue
            file_at,virtual_at=struct.unpack_from('<QQ',data,at+8)
            alignment=struct.unpack_from('<Q',data,at+48)[0]
            assert alignment>=16384 and file_at%16384==virtual_at%16384,item.filename
            alignments.append(alignment)
        raw.seek(item.header_offset+26)
        name_length,extra_length=struct.unpack('<HH',raw.read(4))
        data_start=item.header_offset+30+name_length+extra_length
        assert item.compress_type==zipfile.ZIP_STORED and data_start%16384==0,item.filename
        libraries.append(dict(path=item.filename,loadAlignments=alignments,zipDataOffset=data_start))
assert len(libraries)==10,len(libraries)
print(json.dumps(dict(apk=apk.name,sha256=hashlib.sha256(apk.read_bytes()).hexdigest(),bytes=apk.stat().st_size,
    bundledCatalogAndModelMatchSource=True,static16KBAlignment=True,nativeLibraries=libraries,
    limitation='Static ELF/ZIP verification; no physical 16KB-page device execution claim'),indent=2))
