// Development-only utility using the Android project's already cached ZXing core.
// Website visitors receive only the generated local SVG. No runtime Java dependency.
import com.google.zxing.*;
import com.google.zxing.common.*;
import com.google.zxing.qrcode.QRCodeWriter;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;
import java.nio.file.*;
import java.util.*;

class QrTool {
  static final String URL = "https://courtumpire.com/";
  public static void main(String[] args) throws Exception {
    if (args.length==3 && args[0].equals("rounded")) {
      // ZXing owns encoding and placement. Round only exposed data-module corners;
      // keep finder patterns square and preserve a full four-module quiet zone.
      BitMatrix matrix=new QRCodeWriter().encode(URL, BarcodeFormat.QR_CODE, 0, 0, Map.of(EncodeHintType.MARGIN,4,EncodeHintType.ERROR_CORRECTION,com.google.zxing.qrcode.decoder.ErrorCorrectionLevel.M));
      int size=matrix.getWidth(),edge=size-4;
      StringBuilder svg=new StringBuilder("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 "+size+" "+size+"\"><title>CourtUmpire website QR code</title><g fill=\""+(args[2].equals("light")?"#f7f9fc":"#162820")+"\">");
      for(int y=4;y<edge;y++)for(int x=4;x<edge;x++)if(matrix.get(x,y)){
        boolean finder=(x<11&&y<11)||(x>=edge-7&&y<11)||(x<11&&y>=edge-7);
        double tl=!finder&&!matrix.get(x-1,y)&&!matrix.get(x,y-1)?.14:0,tr=!finder&&!matrix.get(x+1,y)&&!matrix.get(x,y-1)?.14:0,br=!finder&&!matrix.get(x+1,y)&&!matrix.get(x,y+1)?.14:0,bl=!finder&&!matrix.get(x-1,y)&&!matrix.get(x,y+1)?.14:0;
        svg.append("<path d=\"M").append(x+tl).append(' ').append(y).append("H").append(x+1-tr).append("Q").append(x+1).append(' ').append(y).append(' ').append(x+1).append(' ').append(y+tr).append("V").append(y+1-br).append("Q").append(x+1).append(' ').append(y+1).append(' ').append(x+1-br).append(' ').append(y+1).append("H").append(x+bl).append("Q").append(x).append(' ').append(y+1).append(' ').append(x).append(' ').append(y+1-bl).append("V").append(y+tl).append("Q").append(x).append(' ').append(y).append(' ').append(x+tl).append(' ').append(y).append("Z\"/>");
      }
      Files.writeString(Path.of(args[1]),svg.append("</g></svg>\n"));System.out.println("Generated rounded transparent QR: "+URL);return;
    }
    if (args.length==2 && args[0].equals("generate")) {
      BitMatrix matrix=new QRCodeWriter().encode(URL, BarcodeFormat.QR_CODE, 0, 0, Map.of(EncodeHintType.MARGIN,4));
      int size=matrix.getWidth();
      StringBuilder svg=new StringBuilder("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 "+size+" "+size+"\" shape-rendering=\"crispEdges\"><title>CourtUmpire website QR code</title><rect width=\""+size+"\" height=\""+size+"\" fill=\"white\"/><path fill=\"black\" d=\"");
      for(int y=0;y<size;y++) for(int x=0;x<size;x++) if(matrix.get(x,y)) svg.append("M").append(x).append(" ").append(y).append("h1v1h-1Z");
      svg.append("\"/></svg>\n"); Files.writeString(Path.of(args[1]),svg); System.out.println("Generated local QR: "+URL); return;
    }
    if(args.length==2 && args[0].equals("decode")) {
      BufferedImage image=ImageIO.read(new File(args[1]));
      int w=image.getWidth(),h=image.getHeight();
      int[] pixels=image.getRGB(0,0,w,h,null,0,w);
      LuminanceSource source=new RGBLuminanceSource(w,h,pixels);
      Result result=new MultiFormatReader().decode(new BinaryBitmap(new HybridBinarizer(source)),Map.of(DecodeHintType.TRY_HARDER,true,DecodeHintType.ALSO_INVERTED,true, DecodeHintType.POSSIBLE_FORMATS,List.of(BarcodeFormat.QR_CODE)));
      if(!URL.equals(result.getText())) throw new Exception("Unexpected QR content: "+result.getText());
      System.out.println("Decoded exactly: "+result.getText()); return;
    }
    throw new IllegalArgumentException("Use generate <svg> or decode <png>");
  }
}
