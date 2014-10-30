video=document.getElementById('video')
canvas=document.getElementById('canvas')
_=canvas.getContext('2d')
ccanvas=document.getElementById('comp')
c_=ccanvas.getContext('2d')
navigator.webkitGetUserMedia({audio:true,video:true},function(stream){
	s=stream
	video.src=window.webkitURL.createObjectURL(stream)
	video.addEventListener('play',
		function(){setInterval(dump,1000/25)}
	)
},function(){
	throw new Error('OOOOOOOH! DEEEEENIED!');
})
compression=5
width=height=0
function dump(){
	if(canvas.width!=video.videoWidth){
		width=Math.floor(video.videoWidth/compression)
		height=Math.floor(video.videoHeight/compression)
		canvas.width=ccanvas.width=width
		canvas.height=ccanvas.height=height
	}
	_.drawImage(video,width,0,-width,height)
	draw=_.getImageData(0,0,width,height)
	//c_.putImageData(draw,0,0)
	skinfilter()
	test()	
}
huemin=0.0
huemax=0.10
satmin=0.0
satmax=1.0
valmin=0.4
valmax=1.0
function skinfilter(){
	
	skin_filter=_.getImageData(0,0,width,height)
	var total_pixels=skin_filter.width*skin_filter.height
	var index_value=total_pixels*4
	
	var count_data_big_array=0;
	for (var y=0 ; y<height ; y++)
	{
		for (var x=0 ; x<width ; x++)
		{
			index_value = x+y*width
			r = draw.data[count_data_big_array]
            		g = draw.data[count_data_big_array+1]
            		b = draw.data[count_data_big_array+2]
            		a = draw.data[count_data_big_array+3]

            		hsv = rgb2Hsv(r,g,b);
            		//When the hand is too lose (hsv[0] > 0.59 && hsv[0] < 1.0)
			//Skin Range on HSV values
			if(((hsv[0] > huemin && hsv[0] < huemax)||(hsv[0] > 0.59 && hsv[0] < 1.0))&&(hsv[1] > satmin && hsv[1] < satmax)&&(hsv[2] > valmin && hsv[2] < valmax)){

	       			skin_filter[count_data_big_array]=r
				skin_filter[count_data_big_array+1]=g
				skin_filter[count_data_big_array+2]=b
				skin_filter[count_data_big_array+3]=a
	        	}else{

	        		skin_filter.data[count_data_big_array]=
				skin_filter.data[count_data_big_array+1]=
				skin_filter.data[count_data_big_array+2]=0
				skin_filter.data[count_data_big_array+3]=0
	        	}

            		count_data_big_array=index_value*4;
		}
	}
	draw=skin_filter
}

function rgb2Hsv(r, g, b){
	
    r = r/255
    g = g/255
    b = b/255;

    var max = Math.max(r, g, b)
    var min = Math.min(r, g, b);

    var h, s, v = max;

    var d = max - min;

    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0; // achromatic
    }else{

        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
    	}
   		h /= 6;
   	}

    return [h, s, v];
}

last=false
thresh=150
down=false
wasdown=false
function test(){
	delt=_.createImageData(width,height)
	if(last!==false){
		var totalx=0,totaly=0,totald=0,totaln=delt.width*delt.height
		,dscl=0
		,pix=totaln*4;while(pix-=4){
			var d=Math.abs(
				draw.data[pix]-last.data[pix]
			)+Math.abs(
				draw.data[pix+1]-last.data[pix+1]
			)+Math.abs(
				draw.data[pix+2]-last.data[pix+2]
			)
			if(d>thresh){
				delt.data[pix]=160
				delt.data[pix+1]=255
					delt.data[pix+2]=
				delt.data[pix+3]=255
				totald+=1
				totalx+=((pix/4)%width)
				totaly+=(Math.floor((pix/4)/delt.height))
			}
			else{
				delt.data[pix]=
					delt.data[pix+1]=
					delt.data[pix+2]=0
				delt.data[pix+3]=0
			}
		}
	}
	//slide.setAttribute('style','display:initial')
	//slide.value=(totalx/totald)/width
	if(totald){
		down={
			x:totalx/totald,
			y:totaly/totald,
			d:totald
		}
		handledown()
	}
	//console.log(totald)
	last=draw
	c_.putImageData(delt,0,0)
}
movethresh=2
brightthresh=300
overthresh=1000
function calibrate(){
	wasdown={
		x:down.x,
		y:down.y,
		d:down.d
	}
}
avg=0
state=0//States: 0 waiting for gesture, 1 waiting for next move after gesture, 2 waiting for gesture to end
function handledown(){
	avg=0.9*avg+0.1*down.d
	var davg=down.d-avg,good=davg>brightthresh
	//console.log(davg)
	switch(state){
		case 0:
			if(good){//Found a gesture, waiting for next move
				state=1
				calibrate()
			}
			break
		case 2://Wait for gesture to end
			if(!good){//Gesture ended
				state=0
			}
			break;
		case 1://Got next move, do something based on direction
			var dx=down.x-wasdown.x,dy=down.y-wasdown.y
			var dirx=Math.abs(dy)<Math.abs(dx)//(dx,dy) is on a bowtie
			//console.log(good,davg)
			if(dx<-movethresh&&dirx){
				//console.log('right')
				Reveal.navigateRight()
			}
			else if(dx>movethresh&&dirx){
				//console.log('left')
				Reveal.navigateLeft()
			}
			if(dy>movethresh&&!dirx){
				if(davg>overthresh){
					//console.log('over up')
					Reveal.toggleOverview()
				}
				else{
					//console.log('up')
					Reveal.navigateUp()
				}
			}
			else if(dy<-movethresh&&!dirx){
				if(davg>overthresh){
					//console.log('over down')
					Reveal.toggleOverview()
				}
				else{
					//console.log('down')
					Reveal.navigateDown()
				}
			}
			state=2
			break
	}
}
