define("ScatterPlotMatrix", ['jquery'],function(jquery){
    var ScatterPlotMatrix = function(parentId, data){
        var self = this;
        self.data = data? data: ScatterPlotMatrix.sampleData;
        self.parentId = parentId;
        self.binsNumPerAxis = self.data.binsPerAxis;
        self.parentSelection = d3.select("#"+parentId);
        self.allAttributes = [];
        self.cellsData = null;
        self.axisData = null;
        self.isDefaultCategorical = null;
        self.categoricalValue2ColorMap = null;
        self.initScatterPlotMatrix();
    };
    ScatterPlotMatrix.DEFAULTCOLORS = [ "#e1faf4", "#c2f7f8", "#97eef5", "#7ed9dd", "#54bdc1", "#2e969a", "#1c6e72" ];
    ScatterPlotMatrix.CATEGORICALCOLORPALETTE = [ '#54bdc1', '#e6c400', '#b64cbf', '#97da50', '#ff4b37', '#a1a2a0', '#563864', '#66e7b7', '#9a1919',
			'#f2db76', '#90a9b3', '#265c49', '#a2d9db', '#8398f6', '#8a8b34', '#46b43b', '#d18800', '#b1a2ca', '#854a06', '#3d55c3',
			'#c3d600' ];
    ScatterPlotMatrix.CORRELATIONCOLORPALETTE = [ '#697395', '#98a5cf', '#cfd8f6', '#89a9b2', '#f6b145', '#e38427', '#f27339' ];
    ScatterPlotMatrix.STYLECONFIG = {
        cellSize: {
            min:105,
            max: 125
        },
        padding: 5,
        ticksNumber:5,
        minMatricNum: 3,
        maxMatricNum: 7,
        defaultBinsNumber:5,
        legendPadding: 20
        
    };
    
    
    ScatterPlotMatrix.prototype.initScatterPlotMatrix = function(){
        var self = this;
        self.perpareData();
        self.createScatterPlotMatrix();
        self.createLegend();
        
    };
    
    ScatterPlotMatrix.prototype.getCellSize =function(){
        var self = this;
        if (self.cellSize) return self.cellSize;
        self.cellSize = self.allAttributes.length > 4? ScatterPlotMatrix.STYLECONFIG.cellSize.min: ScatterPlotMatrix.STYLECONFIG.cellSize.max;
        return self.cellSize;       
    };
    
    ScatterPlotMatrix.prototype.perpareData = function(){
        var self = this;
        self.isDefaultCategorical = self.data.legend.isDefaultCategorical;
        if(self.isDefaultCategorical )self.defaultCategoricalColorScale = self.getDefaultCategoricalColorScale();
        else self.categoricalValue2ColorMap = self.createCategoricalValue2ColorMap();
        self.axisData = self.getAttributesArray();
        
    };
    
    ScatterPlotMatrix.prototype.getDefaultCategoricalColorScale = function(){
    	var self = this;
    	if(self.data.legend.categoricalValues)
    	return d3.scale.quantile().domain(d3.extent(self.data.legend.categoricalValues)).range(ScatterPlotMatrix.DEFAULTCOLORS);
    	var categoricalValues = [];
    	var cellsData = self.getCellsData();
    	cellsData.forEach(function(cellData){
    		if(cellData.binRecords)
    		cellData.binRecords.forEach(function(bin){
    			categoricalValues.push(bin.categoricalValue);
    		});
    	});
    	return d3.scale.quantile().domain(d3.extent(categoricalValues)).range(ScatterPlotMatrix.DEFAULTCOLORS);
    }
    
    ScatterPlotMatrix.prototype.createCategoricalValue2ColorMap = function(){
        var self = this;
        if (self.isDefaultCategorical) return;
        var categoricalValues = self.data.legend.categoricalValues;
        categoricalValues = self.sortValues(categoricalValues);
        var baseColors = ScatterPlotMatrix.CATEGORICALCOLORPALETTE;
        var displayName = self.data.legend.categoricalName;
        if (categoricalValues === undefined || baseColors === undefined || displayName === undefined) {
            return;
        }
		//make categorical value to color map
        var categoricalValue2ColorMap = {};
		self.categoricalColorsMap = {};
		if (categoricalValues.length <= baseColors.length) {
			for (var i = 0; i < categoricalValues.length; i++) {
				categoricalValue2ColorMap[categoricalValues[i]] = [ baseColors[i], categoricalValues[i] ];
				self.categoricalColorsMap[baseColors[i]] = categoricalValues[i];
			}
		} else {
			for (var i = 0; i < baseColors.length - 1; i++) {
				categoricalValue2ColorMap[categoricalValues[i]] = [ baseColors[i], categoricalValues[i] ];
				self.categoricalColorsMap[baseColors[i]] = categoricalValues[i];
			}
			self.categoricalColorsMap[baseColors[i]] = "Other";
			for (; i < categoricalValues.length; i++) {
				categoricalValue2ColorMap[categoricalValues[i]] = [ baseColors[baseColors.length - 1], "Other" ];
			}
		}
			//assign categoricalValue2ColorMap to global self.categoricalValue2ColorMap
		return categoricalValue2ColorMap;
    };
    
    ScatterPlotMatrix.prototype.sortValues = function(categoricalValues){
    	var self = this;
    	var newCategoricalValues = [];
    	var allBinsRecords = [];
    	var cellsData = self.getCellsData();
    	cellsData.forEach(function(cellData){
    		if(cellData.binRecords)
    			allBinsRecords = allBinsRecords.concat(cellData.binRecords);
    	});
    	var probabilityMap = {};
    	allBinsRecords.forEach(function(record){
    		if(probabilityMap[record.categoricalValue])
    		probabilityMap[record.categoricalValue]++;
    		else probabilityMap[record.categoricalValue] = 1;
    	});
    	d3.values(probabilityMap)
    	var probabilityList = unique(d3.values(probabilityMap)).sort(function(a,b){
    		return b-a;
    	});
    	var sortMap = {};
    	probabilityList.forEach(function(number){
    		for(var valueKey in probabilityMap){
        		if(probabilityMap.hasOwnProperty(valueKey)&&probabilityMap[valueKey]===number){
        			if(newCategoricalValues.indexOf(valueKey) ==-1){
        				newCategoricalValues.push(valueKey);
        				var index = categoricalValues.indexOf(valueKey)
        				if(index!==-1)categoricalValues.splice(index,1);
        			}
        			
        		}
        	}
    		
    	});
    	
    	newCategoricalValues = newCategoricalValues.concat(categoricalValues);
    	function unique(arr) {
    		  var ret = []
    		  var hash = {}
    		 
    		  for (var i = 0; i < arr.length; i++) {
    		    var item = arr[i]
    		    var key = typeof(item) + item
    		    if (hash[key] !== 1) {
    		      ret.push(item)
    		      hash[key] = 1
    		    }
    		  }
    		 
    		  return ret
    		}
    	
    	return newCategoricalValues;
    }
    
    ScatterPlotMatrix.prototype.getAttributesArray = function(){
        return this.data.axis;
    };
    ScatterPlotMatrix.prototype.getCellsData = function(){
         var self = this;
         if (self.cellsData) return self.cellsData;
         self.cellsData = self.cross();
         return self.cellsData;
    
  };
  ScatterPlotMatrix.prototype.getAllAttributes = function(){
      var self = this;
      if (self.allAttributes&&self.allAttributes.length>0) return self.allAttributes;
      self.data.axis.forEach(function(attribute){
          self.allAttributes.push(attribute.attributeName);
      });
      return self.allAttributes;
 
};
    
    ScatterPlotMatrix.prototype.cross = function(){
        var self = this;
        var a = self.getAllAttributes(), b = self.getAllAttributes(), c = [],n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) {
            var binCell = self.data.correlation.filter(function(d){
                return a[i]===d.xAttribute && b[j]===d.yAttribute;
            });
            var correlationCell = self.data.correlation.filter(function(d){
                return a[i]===d.yAttribute && b[j]===d.xAttribute;
            });
            var cellData = null;
            if (binCell.length >0)
                cellData = {xAttribute: a[i], i: i, yAttribute: b[j], j: j,binRecords: binCell[0].binRecords};
            if(correlationCell.length>0)
                cellData = {xAttribute: a[i], i: i, yAttribute: b[j], j: j,correlation: correlationCell[0].correlationValue};
            cellData? c.push(cellData):c.push({xAttribute: a[i], i: i, yAttribute: b[j], j: j});
        }
        return c;
        
    };
    
    ScatterPlotMatrix.prototype.createScatterPlotMatrix = function(){
        var self = this;
        var padding = ScatterPlotMatrix.STYLECONFIG.padding;
        var ticksNumber = self.getAllAttributes().length;
        self.xScale = d3.scale.linear().range([padding / 2, self.getCellSize() - padding / 2]);
        self.yScale = d3.scale.linear().range([self.getCellSize() - padding / 2, padding / 2]);
        self.xAxis = d3.svg.axis().scale(self.xScale).orient("bottom").ticks(ticksNumber);
        self.yAxis = d3.svg.axis().scale(self.yScale).orient("left").ticks(ticksNumber);
        self.xAxis.tickSize(self.getCellSize() * ticksNumber);
        self.yAxis.tickSize(-self.getCellSize() * ticksNumber);
        self.drawAxis();
        self.drawBackground();
        self.drawCells();
    };
    
    ScatterPlotMatrix.prototype.drawSvgFrame = function(){
        var self = this;
        var translateValue = self.getSvgFrameTranslateValue();
        var svg = self.parentSelection.append("svg")
        .attr("class", "eid-scatter-plot-matrix")
        .attr("width", self.getSvgFrameSize().width)
        .attr("height", self.getSvgFrameSize().height)
        .append("g")
        .attr("transform", "translate(" + translateValue.x + "," + translateValue.y + ")");
        return svg;
    };
    ScatterPlotMatrix.prototype.getSvgFrame = function(){
        var self = this;
        if (self.svgFrame) return self.svgFrame;
        self.svgFrame = self.drawSvgFrame();
        return self.svgFrame;
    };
    
    
    ScatterPlotMatrix.prototype.getScatterPlotMatrixSize = function(){
        var self = this;
        return {width: self.getCellSize() * self.getAllAttributes().length, height: self.getCellSize() * self.getAllAttributes().length};
    };
    
    ScatterPlotMatrix.prototype.getSvgFrameSize = function(){
        var self = this;
        if(self.svgFrameSize) return self.svgFrameSize;
        var padding = ScatterPlotMatrix.STYLECONFIG.padding;
        var svgFrameMinPadding = 2*padding;
        var parent = jquery("#"+self.parentId);
        var parentWidth = parent.width();
        var parentHeight = parent.height();
        var minOffsetHeight = self.getScatterPlotMatrixSize().height + 4*svgFrameMinPadding;
        var minOffsetWidth = self.getScatterPlotMatrixSize().width + 2*svgFrameMinPadding + 200/*200 is the legend max width*/;
        if(parentHeight < minOffsetHeight) parent.height(minOffsetHeight);
        if(parentWidth < minOffsetWidth) parent.width(minOffsetWidth);
        self.svgFrameSize = {width:parent.width(), height:parent.height()};
        return self.svgFrameSize;
        
    };
    
    
    ScatterPlotMatrix.prototype.getSvgFrameTranslateValue = function(){
        var self = this;
        var scatterPlotMatrixSize = self.getScatterPlotMatrixSize();
        var svgFrameSize = self.getSvgFrameSize();
        return {x: svgFrameSize.width/2 - scatterPlotMatrixSize.width/2, y:12 };
    };
    
    
    ScatterPlotMatrix.prototype.drawBackground = function(){
        var self = this;
        var padding = ScatterPlotMatrix.STYLECONFIG.padding;
        var svgFrame = self.getSvgFrame();
        svgFrame.append("g")
        .attr("transform", "translate(0 ," + padding / 2 + ")")
        .append("rect")
        .attr("class", "background")
        .attr("width", self.getCellSize()*self.getAllAttributes().length - padding / 2 -1)
        .attr("height", self.getCellSize()*self.getAllAttributes().length - padding / 2);
    };
    
    ScatterPlotMatrix.prototype.drawAxis = function(){
        var self = this;
        var svgFrame = self.getSvgFrame();
        svgFrame.selectAll(".x.axis")
        .data(self.getXAxisData())
        .enter().append("g")
        .attr("class", "x axis")
        .attr("transform", function(d, i) { return "translate(" + i  * self.getCellSize() + ",0)"; })
        .each(function(d) { self.xScale.domain(d.valueRange); d3.select(this).call(self.xAxis); });

        svgFrame.selectAll(".y.axis")
        .data(self.getYAxisData())
        .enter().append("g")
        .attr("class", "y axis")
        .attr("transform", function(d, i) { return "translate(0," + (i+1) * self.getCellSize() + ")"; })
        .each(function(d) {self.yScale.domain(d.valueRange); d3.select(this).call(self.yAxis); });
    };
    ScatterPlotMatrix.prototype.drawCells = function(){
        var self = this;
        var svgFrame = self.getSvgFrame();
        svgFrame.selectAll(".cell")
        .data(self.getCellsData())
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + (d.i) * self.getCellSize() + "," + d.j * self.getCellSize() + ")"; });
        self.createCellInner();
    };
    ScatterPlotMatrix.prototype.getXAxisData = function(){
        var self = this;
        return self.axisData.slice(0,self.axisData.length-1);
    };
    ScatterPlotMatrix.prototype.getYAxisData = function(){
        var self = this;
        return self.axisData.slice(1,self.axisData.length);
    };
    
    ScatterPlotMatrix.prototype.createCellInner = function(){
        var self = this;
        self.padding = ScatterPlotMatrix.STYLECONFIG.padding;
        var cells = d3.selectAll(".cell");
        cells.append("rect")
        .attr("x", self.padding / 2)
        .attr("y", self.padding / 2)
        .attr("width", self.getCellSize() - self.padding)
        .attr("height", self.getCellSize() - self.padding);
        self.addAttributeNameOnSymmetryAxis();
        self.createBinsBelowSymmetryAxis();
        self.addCorrelationAboveSymmetryAxis();

    };
    ScatterPlotMatrix.prototype.addAttributeNameOnSymmetryAxis = function(){
        var self = this;
        self.attibuteNameCells = d3.selectAll(".cell").filter(function(cellData){
           return cellData.i === cellData.j;
        });

        self.attibuteNameCells.selectAll("rect")
        .attr("class", "attrNameRect");
        self.attibuteNameCells.append("text")
        .attr("class","attrNameText")
        .attr("x", self.getCellSize()/2 - self.padding/2)
        .attr("y", self.getCellSize()/2 - self.padding/2)
        .text(function(d) { return d.xAttribute; })
        .append("title")
        .text(function(d) { return d.xAttribute; });
        self.attibuteNameCells.on("mouseover", function(d){
            var highlightCell = d3.selectAll(".cell").filter(function(cellData){
                return cellData.i===d.i || cellData.j === d.j;
            }).classed({
                "highlight": true,
                "dim": false
            });
            highlightCell.filter(function(cellData){
                return cellData.i === cellData.j;
            }).classed({
                "bold": true
            });
             d3.selectAll(".cell").filter(function(cellData){
                return cellData.i!==d.i && cellData.j !== d.j;
            }).classed({
                "highlight": false,
                "dim": true,
                "bold": false
            });
        });
         self.attibuteNameCells.on("mouseout", self.cellMouseoutListener);
       
   };
   
   
   ScatterPlotMatrix.prototype.cellMouseoutListener = function(){
       d3.selectAll(".cell")
            .classed({
                "highlight": true,
                "dim": false,
                "bold": false
            });
   };
   
   ScatterPlotMatrix.prototype.cellMouseoverListener = function(d){
        var highlightCell = d3.selectAll(".cell").filter(function(cellData){
                return (cellData.i===d.i||cellData.i === d.j)&&(cellData.j === d.i||cellData.j === d.j);
            }).classed({
                "highlight": true,
                "dim": false
            });
        highlightCell.filter(function(cellData){
            return cellData.i === cellData.j;
        }).classed({
            "bold": true
        });
        d3.selectAll(".cell").filter(function(cellData){
                return !((cellData.i===d.i||cellData.i === d.j)&&(cellData.j === d.i||cellData.j === d.j));
            }).classed({
                "highlight": false,
                "dim": true,
                "bold": false
            });
   };
   
    ScatterPlotMatrix.prototype.createBinsBelowSymmetryAxis = function(){
        var self = this;
        self.binsCells = d3.selectAll(".cell").filter(function(cellData){
            return cellData.i < cellData.j;
        });
        self.binsCells.selectAll("rect")
        .attr("class", "binsBackgroundRect");
        self.binsCells.append("g").attr("transform", "translate("+ self.padding / 2+","+ self.padding / 2+ ")").each(function(cellData){
            var cell = d3.select(this);
            cell.selectAll("rect")
            .data(cellData.binRecords)
            .enter().append("rect")
            .attr("class", "bin")
            .attr("x", function(d) { 
                return  d.xBucketId*(self.getCellSize() - self.padding)/self.binsNumPerAxis; })
            .attr("y", function(d) { 
                return  (self.binsNumPerAxis-1 - d.yBucketId)*(self.getCellSize() - self.padding)/self.binsNumPerAxis; })
            .attr("width", (self.getCellSize() - self.padding)/self.binsNumPerAxis)
            .attr("height", (self.getCellSize() - self.padding)/self.binsNumPerAxis)
            .attr("fill", function(currentBinData){
                return self.setBinColor(currentBinData);
            });
            });
        self.binsCells.on("mouseover", self.cellMouseoverListener);
        self.binsCells.on("mouseout", self.cellMouseoutListener);
    };
    
     ScatterPlotMatrix.prototype.setBinColor = function(binData){
         var self = this;
         if (self.isDefaultCategorical)
             return self.defaultCategoricalColorScale(binData.categoricalValue);
         else return self.categoricalValue2ColorMap[binData.categoricalValue][0];
     };
   
    ScatterPlotMatrix.prototype.addCorrelationAboveSymmetryAxis = function(){
        var self = this;
        var correlationColorScale = d3.scale.quantile().domain([ -1, 1 ]).range(ScatterPlotMatrix.CORRELATIONCOLORPALETTE);
        self.correlationCells = d3.selectAll(".cell").filter(function(cellData){
            return cellData.i > cellData.j;
        });
        self.correlationCells.selectAll("rect")
        .attr("fill",function(cellData){
            return correlationColorScale(Math.round(10 * cellData.correlation)/10);
        });
        self.correlationCells.append("text")
        .attr("class","correlationText")
        .attr("x", self.getCellSize()/2 - self.padding/2)
        .attr("y", self.getCellSize()/2 - self.padding/2)
        .attr("dy", ".71em")
        .text(function(d) { return Math.round(10 * d.correlation)/10; });
        
        self.correlationCells.on("mouseover", self.cellMouseoverListener);
        self.correlationCells.on("mouseout", self.cellMouseoutListener);
        
    };
    ScatterPlotMatrix.prototype.createLegend = function(){
        var self = this;
        var legendTranslateValue = self.getLegendTranslateValue();
        var g = d3.select("svg").append("g").attr("transform", "translate("+legendTranslateValue.x+","+ legendTranslateValue.y+")").append("g");
        g.append("text").attr("x", 0).attr("y", 12).attr("class", "eid-legend-title").text(self.data.legend.categoricalName);
        var colors = [];
        self.isDefaultCategorical? colors = ScatterPlotMatrix.DEFAULTCOLORS: colors = d3.keys(self.categoricalColorsMap);
        var legends = g.selectAll(".eid-legend-entry").data(colors).enter().append("g").attr("class", "eid-legend-entry").attr(
			"transform", function(d, i) {
				return "translate(0," + (25 + (i * 20)) + ")";
			});
        
        self.isDefaultCategorical? self.addDefaultCategoricalLegendText(legends): self.addCategoricalLegendText(legends);
        legends.on("mouseover", function(d){
            self.legendMouseover(d);
        });
        legends.on("mouseout", function(d){
            self.legendMouseout(d);
        });
    };
    
    ScatterPlotMatrix.prototype.change2EndecaSiFormat = function(str, sigDigits) {
		var term = '.' + sigDigits + 's';
		if (d3.formatPrefix(str) !== undefined && d3.formatPrefix(str).symbol === 'G') {
			str = d3.format(term)(str);
			str = str.replace('G', 'B');
		} else {
			str = d3.format(term)(str);
		}
		return (str.indexOf('.') !== -1) ? str.replace(/\.?0+$/g, '') : str;
    };
    ScatterPlotMatrix.prototype.addDefaultCategoricalLegendText = function(legends){
        var self = this;
        legends.append("rect").attr("x", 0).attr("width", 10).attr("height", 10).style(
			"fill", function(d) {
				return d;
			});
        legends.append("text").attr("x", 15).attr("y", 6).attr("dy", ".3em").text(
		function(d, i) {
			if (i === 0) {
				return "Less than "+ self.change2EndecaSiFormat(Math.ceil(self.defaultCategoricalColorScale.quantiles()[i]), 2);
			} else if (i === (ScatterPlotMatrix.DEFAULTCOLORS.length - 1)) {
				return self.change2EndecaSiFormat(Math.ceil(self.defaultCategoricalColorScale.quantiles()[i - 1]), 2) + " or more";
			} else {
				return self.change2EndecaSiFormat(Math.ceil(self.defaultCategoricalColorScale.quantiles()[i - 1]), 2) + " - "
					+ self.change2EndecaSiFormat(Math.ceil(self.defaultCategoricalColorScale.quantiles()[i]), 2);
			}
	});
       
    };
    
    ScatterPlotMatrix.prototype.addCategoricalLegendText = function(legends){
        var self = this;
        legends.append("rect").attr("x", 0).attr("width", 25).attr("height", 10).style(
			"fill", function(d) {
				return d;
			});
        legends.append("text").attr("x", 30).attr("y", 6).attr("dy", ".3em").text(function(d,i){
            return self.categoricalColorsMap[d];
        })
        .append("title")
        .text(function(d) { return self.categoricalColorsMap[d];});
      
    };
    ScatterPlotMatrix.prototype.getLegendTranslateValue = function(){
        var self = this;
        var legendPadding = ScatterPlotMatrix.STYLECONFIG.legendPadding;
        var svgFrameTranslateValue = self.getSvgFrameTranslateValue();
        var y = svgFrameTranslateValue.y;
        var x = svgFrameTranslateValue.x + self.getScatterPlotMatrixSize().width + legendPadding;
        return {x:x, y:y};
    };
    ScatterPlotMatrix.prototype.legendMouseover = function(color){
        var self = this;
        var highlightBins = d3.selectAll(".bin").filter(function(binRecord){
            if (self.isDefaultCategorical)
            return self.defaultCategoricalColorScale(binRecord.categoricalValue) === color;
            else return self.categoricalValue2ColorMap[binRecord.categoricalValue][0] === color;
        
        });
        if (!highlightBins || highlightBins.length===0){
            return;
        }
        d3.selectAll(".bin").classed({
            "highlight": false,
            "dim": true
        });
        highlightBins .classed({
            "highlight": true,
            "dim": false
        });
        
    };
    ScatterPlotMatrix.prototype.legendMouseout = function(color){
        var self = this;
        d3.selectAll(".bin").classed({
            "highlight": true,
            "dim": false
        });
    };
    
    ScatterPlotMatrix.sampleData = {
        
        axis:[{
            attributeName : "sepal length",
            valueRange : [12,388]
        },{
            attributeName : "sepal width",
            valueRange : [32,288]
        },{
            attributeName : "petal length",
            valueRange : [52,135]
        },{
            attributeName : "petal width",
            valueRange : [42,540]
        }],
        correlation: [{
                            xAttribute : "sepal length",
                            yAttribute : "sepal width",
                            binRecords: [{
                                    xBucketId: 1,
                                    yBucketId: 1,
                                    categoricalValue: 10
                            }],
                            correlationValue: 0.3
                    },{
                        xAttribute : "sepal length",
                        yAttribute : "petal length",
                        binRecords: [{
                                    xBucketId: 0,
                                    yBucketId: 1,
                                    categoricalValue: 20
                            },{
                                    xBucketId: 3,
                                    yBucketId: 1,
                                     categoricalValue: 9
                            },{
                                    xBucketId: 3,
                                    yBucketId: 0,
                                    categoricalValue: 80
                            }],
                        correlationValue: 0.2
                    },{
                        xAttribute : "sepal length",
                        yAttribute : "petal width",
                        binRecords: [{
                                    xBucketId: 0,
                                    yBucketId: 1,
                                    categoricalValue: 70
                            },{
                                    xBucketId: 3,
                                    yBucketId: 2,
                                     categoricalValue: 90
                            },{
                                    xBucketId: 3,
                                    yBucketId: 0,
                                    categoricalValue: 50
                            }],
                        correlationValue: 0.7
                    },{
                        xAttribute : "sepal width",
                        yAttribute : "petal length",
                        binRecords: [{
                                    xBucketId: 1,
                                    yBucketId: 1,
                                    categoricalValue: 10
                            },{
                                    xBucketId: 2,
                                    yBucketId: 1,
                                    categoricalValue: 100
                            },{
                                    xBucketId: 3,
                                    yBucketId: 0,
                                    categoricalValue: 110
                            }],
                        correlationValue: 0.2
                    },{
                        xAttribute : "sepal width",
                        yAttribute : "petal width",
                        binRecords: [{
                                    xBucketId: 0,
                                    yBucketId: 1,
                                    categoricalValue: 120
                            },{
                                    xBucketId: 2,
                                    yBucketId: 1,
                                     categoricalValue: 130
                            },{
                                    xBucketId: 3,
                                    yBucketId: 1,
                                    categoricalValue: 110
                            }],
                        correlationValue: 0.7
                    },{
                        xAttribute : "petal length",
                        yAttribute : "petal width",
                        binRecords: [{
                                    xBucketId: 0,
                                    yBucketId: 1,
                                    categoricalValue: 110
                            },{
                                    xBucketId: 3,
                                    yBucketId: 3,
                                    categoricalValue: 70
                            },{
                                    xBucketId: 3,
                                    yBucketId: 0,
                                    categoricalValue: 140
                            }],
                        correlationValue: 0.1
        }],          
        binsPerAxis: 5,
        legend: {
            isDefaultCategorical: true,
            categoricalName: "Number of Records ",
            categoricalValues: [5,4,89,9,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200]
        }
    };
    return ScatterPlotMatrix;
    
});

define(["ScatterPlotMatrix"], function(ScatterPlotMatrix){
	new ScatterPlotMatrix("scat");
});