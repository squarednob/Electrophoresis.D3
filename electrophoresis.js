var radio_switch;
var measure_template = "10,20,50,100";

//マージンと縦横長さの設定：
var margin = {top: 40, right: 10, bottom: 30, left: 10},
width = 360 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;

//マージンありの画面設定：
var svg = d3.select(".field").append("svg")
.attr("id","s")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Making forms class
var MakingForm = function(){
    this.current_switch = "#DNA_sequence"; // initiate with DNA sequence.

    for(var i=1;i<7;i++){
        $("#enzymes0").clone().appendTo("#select_boxes").attr("id","enzymes"+i);
        $("#enzymes"+i).children().eq(i*2).attr("selected","selected");
    }
    
    //firstly hide free text section
    $(".free_area").hide();
};

MakingForm.prototype.showFreeForm = function(){
        $(".free_area").show();
        $(".free_area").attr("id","free");
        
        $(".free_area textarea").val("");
        $(".free_area .cutting").each(function(index,element){
            $(this).val("");
         });
         
        
};

MakingForm.prototype.showObamaForm = function(){
    var words = ["USA","nuclear","security","privacy","growth","public","global"];
    
    $(".free_area").show();
    $(".free_area").attr("id","Obama");
    
    $(".free_area textarea").val("Obabmacare");
    $(".free_area .measure").val(measure_template);
    $(".free_area .cutting").each(function(index,element){
        $(this).val(words[index])});
};

MakingForm.prototype.hideShow = function(){
    this.switchChange();
    
    if (this.current_switch == "#free") {
        
        $("#DNA_sequence").hide();
        this.showFreeForm();
    } else if (this.current_switch == "#Obama") {
        
        $("#DNA_sequence").hide();
        this.showObamaForm();
    } else if (this.current_switch == "#DNA_sequence") {
        
        $(".free_area").hide();
        $("#DNA_sequence").show();
    }
};

//switch button object.
MakingForm.prototype.switchChange = function(){
    var selected = $("input[name='radio']:checked").val();
    this.current_switch = selected;
};

//ready form.
$(function(){
    // hide free form and show DNA form only.
    $("#free").hide();
    var form = new MakingForm();
        
    //radio button event listener
    $("input[name='radio']").change(function () {
        form.hideShow();
    });
    
    //reset
    $("#reset").on("click",this,function() {
        $(".well").contents().remove();
        $(".well").remove();
        $("defs").remove();
    });
    
    //start button
    $("#subButton").on("click",this,function(){
        radio_switch = form.current_switch;
        var len_seq_container = cutSequences(); 
        
        displayGel(len_seq_container);
    });

});


var cutSequences = function(){
    var len_seq_container_proto = [];
    
    //assign measure into 0.
    len_seq_container_proto[0] = makeMeasureContainer(radio_switch);
    
    //assign selected cuttted secuence.
    $(radio_switch + " .cutting").each(function(index,element){
        var where_to_cut = null;
        var cuttings = $(element).val().toUpperCase();

        var cuttings_id = $("option:selected",element).text();
        if ($("#"+cuttings_id).attr("class") == "1"||"2"||"3"||"4"||"5"||"0") {
            where_to_cut = $("#"+cuttings_id).attr("class");
        }
        len_seq_container_proto[index+1] = cutSeq(cuttings,where_to_cut);
    });
    
    return len_seq_container_proto;
};

var makeMeasureContainer = function(){
    var parsed_measure = [];
    
    var measure = $(radio_switch + " .measure").val();
    var measure_container = measure.split(",");
    
    for(var i=0; i<measure_container.length; i++){
        parsed_measure[i] = parseInt(measure_container[i]);
    }
    
    console.log(parsed_measure);
    return parsed_measure;
};


//配列取得と制限酵素によるカット関数 //
var cutSeq = function(cuttings,where_to_cut){
    var len_seq = [];
    var DNA_seq = $(radio_switch + " .sequence").val().toUpperCase();

    var splitted = DNA_seq.split(cuttings);
    for (var i=0; i < splitted.length; i++){
        len_seq[i] = splitted[i].length;
    }
    
    //distribute vanished sequence by split.
    return distributeCuttedSequence(cuttings,len_seq,where_to_cut);

};

var distributeCuttedSequence = function(seq_value,len_seq,where_to_cut){
     if(where_to_cut){
         var left = parseInt(where_to_cut);
         var right = seq_value.length - parseInt(where_to_cut);
         if(len_seq.length == 1){
             len_seq[0] += left+right;
         } else{
             for(var i=0; i<len_seq.length-1;i++){
                 len_seq[i] += left;
             }
             for(i=1; i<len_seq.length;i++){
                 len_seq[i] += right;
             }
         }
     }
     return len_seq;
};

//ディスプレイ関数。
var displayGel = function(len_seq_container) {

//rectのエフェクト
var rectEff = svg.append("defs")
.append("filter").attr("id", "bands").attr("height","500%").attr("widht","100%")
.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", 2).attr("result", "blur")
.append("feOffset").attr("result","offsetBlur").attr("dx",0).attr("dy",-5)
.append("feBrend").attr("in","blur").attr("in2","offsetBlur").attr("mode","normal");

//make max value
    var marged_list = d3.merge(len_seq_container);
    var max_value = d3.max(marged_list);

//スケール調整
var yScale = d3.scale.sqrt() //ルートにしたが、良いかどうか分からない。文献を当たらないと。
.domain([0, max_value]).range([height,0]);//[height,o]にすることで大きいほうが上に行く。

//ウェルを移動しながら作成
var wells = svg.selectAll("g .well")
.data(len_seq_container).enter()
.append("g")
.attr("class", "well")
.attr("transform", function(d,i){return "translate(" + i*(width/8) + "," + 0 + ")";});

var upper_tooltips = wells.append("text")
.attr("class","tooltip")
.attr("fill","white")
.attr("font-size","5px")
.attr("x",0)
.attr("y",-(margin.top - 9))
.text(function(d,i){if(i==0){return "";} else{return $(radio_switch+" .cutting:eq("+(i-1)+")").val();}});


//rect作成
var rects = wells.selectAll("g .vartical_band") 
.data(function(d){return d;})
.enter()
.append("g")
.attr("class","vartical_band");


//rect属性
var rectAttr = rects
.append("rect")
.attr("x", function(d){return 2;})
.attr("y", function(d){return 0;})//各dを最大値とwidthにスケールを合わせた。
.attr("width", 38)
.attr("height", 12)
.attr("fill", "white")
.attr("filter", "url(#bands)")
.transition()
.attr("height",function(d){ return 1+((height-yScale(d))/60);})
.attr("y",function(d){ return yScale(d);})
.duration(3000);

var each_tooltips = rects.append("text")
                    .attr("class","tooltip")
                    .attr("fill","white")
                    .attr("font-size","5px")
                    .attr("x",0)
                    .attr("y",function(d){ return yScale(d);})
                    .text(function(d){return d;});
                    
    $(".tooltip").hide();
};

//show and hide tooltips through mousehover
$("svg").on("mouseover",this,function(){
    $(".tooltip").show();
});

$("svg").on("mouseout",this,function(){
    $(".tooltip").hide();
});                
