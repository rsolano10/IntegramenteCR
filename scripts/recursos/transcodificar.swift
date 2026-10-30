// Transcodifica un video de gerontogimnasia para la web con AVFoundation
// (incluido en macOS; en este equipo Homebrew no puede compilar ffmpeg).
// H.264 + AAC, lado corto 720 px, bitrate fijo para quedar debajo de 25 MB,
// "fast start" (moov al inicio) y póster JPG del segundo 2.
//
// Uso: swift transcodificar.swift <entrada.mp4> <salida.mp4> <poster.jpg>
import AVFoundation
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count == 4 else {
  FileHandle.standardError.write("uso: transcodificar.swift entrada salida poster\n".data(using: .utf8)!)
  exit(2)
}
let entrada = URL(fileURLWithPath: args[1])
let salida = URL(fileURLWithPath: args[2])
let poster = URL(fileURLWithPath: args[3])
try? FileManager.default.removeItem(at: salida)

let VIDEO_BPS = 3_500_000
let AUDIO_BPS = 128_000
let LADO_CORTO: CGFloat = 720

let asset = AVURLAsset(url: entrada)
guard let vTrack = asset.tracks(withMediaType: .video).first else { fatalError("sin pista de video") }
let aTrack = asset.tracks(withMediaType: .audio).first

// Tamaño de salida respetando la orientación de pantalla.
let disp = vTrack.naturalSize.applying(vTrack.preferredTransform)
let w0 = abs(disp.width), h0 = abs(disp.height)
let escala = LADO_CORTO / min(w0, h0)
func par(_ x: CGFloat) -> Int { Int((x * escala / 2).rounded()) * 2 }
let (wOut, hOut) = (par(w0), par(h0))

let reader = try AVAssetReader(asset: asset)
let writer = try AVAssetWriter(outputURL: salida, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true  // fast start

// Video: la composición aplica la rotación y escala al tamaño de salida.
let comp = AVMutableVideoComposition(propertiesOf: asset)
comp.renderSize = CGSize(width: wOut, height: hOut)
let instr = AVMutableVideoCompositionInstruction()
instr.timeRange = CMTimeRange(start: .zero, duration: asset.duration)
let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: vTrack)
let t = vTrack.preferredTransform
let ajuste = CGAffineTransform(scaleX: CGFloat(wOut) / w0, y: CGFloat(hOut) / h0)
layer.setTransform(t.concatenating(ajuste), at: .zero)
instr.layerInstructions = [layer]
comp.instructions = [instr]

let vOut = AVAssetReaderVideoCompositionOutput(videoTracks: [vTrack], videoSettings: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
])
vOut.videoComposition = comp
reader.add(vOut)
let vIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: wOut,
  AVVideoHeightKey: hOut,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: VIDEO_BPS,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoMaxKeyFrameIntervalDurationKey: 2,
  ],
])
vIn.expectsMediaDataInRealTime = false
writer.add(vIn)

var aOut: AVAssetReaderTrackOutput?
var aIn: AVAssetWriterInput?
if let aTrack {
  let o = AVAssetReaderTrackOutput(track: aTrack, outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM])
  reader.add(o)
  let i = AVAssetWriterInput(mediaType: .audio, outputSettings: [
    AVFormatIDKey: kAudioFormatMPEG4AAC,
    AVNumberOfChannelsKey: 2,
    AVSampleRateKey: 44_100,
    AVEncoderBitRateKey: AUDIO_BPS,
  ])
  writer.add(i)
  (aOut, aIn) = (o, i)
}

guard reader.startReading(), writer.startWriting() else {
  fatalError("no se pudo iniciar: \(String(describing: reader.error ?? writer.error))")
}
writer.startSession(atSourceTime: .zero)

let grupo = DispatchGroup()
func bombear(_ input: AVAssetWriterInput, _ output: AVAssetReaderOutput, _ cola: String) {
  grupo.enter()
  input.requestMediaDataWhenReady(on: DispatchQueue(label: cola)) {
    while input.isReadyForMoreMediaData {
      if let buf = output.copyNextSampleBuffer() {
        input.append(buf)
      } else {
        input.markAsFinished()
        grupo.leave()
        return
      }
    }
  }
}
bombear(vIn, vOut, "video")
if let aIn, let aOut { bombear(aIn, aOut, "audio") }
grupo.wait()

let fin = DispatchSemaphore(value: 0)
writer.finishWriting { fin.signal() }
fin.wait()
guard writer.status == .completed else { fatalError("falló: \(String(describing: writer.error))") }

// Póster del segundo 2.
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.maximumSize = CGSize(width: wOut, height: hOut)
let img = try gen.copyCGImage(at: CMTime(seconds: 2, preferredTimescale: 600), actualTime: nil)
guard let dest = CGImageDestinationCreateWithURL(poster as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else { fatalError("póster") }
CGImageDestinationAddImage(dest, img, [kCGImageDestinationLossyCompressionQuality: 0.82] as CFDictionary)
CGImageDestinationFinalize(dest)

let bytes = (try FileManager.default.attributesOfItem(atPath: salida.path)[.size] as? NSNumber)?.intValue ?? 0
print("\(salida.lastPathComponent)\t\(wOut)x\(hOut)\t\(bytes / 1_000_000) MB")
