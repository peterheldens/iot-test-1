// let wheel_diameter_inches = 9.25
// tested but did not work
// yaw = 180 * atan (accelerationZ/sqrt(accelerationX*accelerationX + accelerationZ*accelerationZ))/M_PI;
// https://engineering.stackexchange.com/questions/3348/calculating-pitch-yaw-and-roll-from-mag-acc-and-gyro-data
// https://os.mbed.com/questions/83017/Calculating-Yaw-using-accelerometer-and-/
// this.yaw = 180 * Math.atan(this.acc_z/Math.sqrt(this.acc_x*this.acc_x + this.acc_z*this.acc_z))/ Math.PI
// this.rad1=Math.PI * this.yaw / 45
// ADD Digits
// ADD fintune swith auto hor vert with base positions
// ADD base position measurement also for horizontal and auto

enum Position {
    //%block="vertical"
    Vertical,
    //%block="horizontal"
    Horizontal,
    //%block="auto"
    Auto
}

enum RotationDirection {
    //%block="clockwise"
    Clockwise,
    //%block="counterclockwise"
    Counterclockwise
}

enum Runstate {
    //% block="start"
    Start,
    //% block="stop"
    Stop,
    //% block="pause"
    Pause,
    //% block="resume"
    Resume
}

enum DiameterOrRadius {
    //%block="diameter"
    Diameter,
    //%block="radius"
    Radius,
    //%block="circumfence"
    Circumfence
}

enum Units {
    //% block="inches"
    Inches,
    //% block="centimeters"
    Centimeters
}

enum ValueType {
    //% block="current"
    Cur,
    //% block="minumum"
    Min,
    //%block="maximum"
    Max,
    //%block="average"
    Avr
}

enum DistanceUnit {
    // https://www.differencebetween.com/difference-between-mile-and-vs-kilometer-km/
    // One mile equals 1760 yards and 
    // one yard contains 3 feet making it equal to 1.609344 kilometers. 
    // One kilometer equals 1000 meters and 0.621371 miles.
    //
    //% block="kilometer"
    Kilometer,
    //% block="meter"
    Meter,
    //% block="centimeter"
    Centimeter,
    //% block="millimeter"
    Millimeter,
    //% block="mile"
    Mile,
    //% block="yard"
    Yard,
    //% block="feet"
    Feet
}

enum SpeedType {
    //% block="kilometers per hour (Kph)"
    Kph,
    //% block="miles per hour (Mph)"
    Mph
}

enum Stream {
    //% block="Device Console"
    MakeCode,
    //% block="Excel Data Streamer"
    DataStreamer
}

/**
 * Functions to operate Speedometer meters.
 */
//% weight=5 color=#2699BF icon="\uf0e4" block="Speedometer"
//% groups='["Setup","Distance","Rotation","Speed","Data","Info","Advanced"]'
namespace speedometer {
    export class Meter {

    // user defined @creation
    private radius : number     //radius in centimeters of micro:bit attached circle
    private _position: Position //position defines rotation are measured vertical or horizontal
    private segments : number   //number of defined circle segments
    private _direction : RotationDirection //rotation direction: clockwise or anti-clockwise

    // user input @runtime
    private runstate : Runstate // runstate defines operation mode: start, stop, pause, resume
    private radioOn : boolean   // switch Radio output on/off
    private serialOn : boolean  // switch Serial output on/off
    private dataStream : Stream // dataSteam format: MakeCode or Excel DataStreamer
    private avrWindow: number   // window in milliseconds to calculate averages
    private amplitude: number   // amplitude threshold (-2PI< a <2PI) to determine new rotation

    // user output @runtime
    private kph : number        // kilometer per hour
    private kph_min : number    // minimum kilometer per hour
    private kph_max : number    // maximum kilometer per hour
    private kph_avr : number    // average kilometer per hour
    private kph_cnt : number    // count of all kph measurements
    private _rotations : number  // number of 360 degree rotations (complete cycle)
    private rpm : number        // rotations per minute
    private rpm_min : number    // minimum rotations per minute
    private rpm_max : number    // maximum rotations per minute
    private rpm_avr : number    // average rotations per minutenumber of 360 degree turnarounds (complete cycle)
    private rpm_cnt : number    // count of all rpm measurements  

    // system defined @runtime
    private acc_x : number      //accelerometer X: for debugging purposes
    private acc_y : number      //accelerometer Y: for debugging purposes
    private acc_z : number      //accelerometer Z: for debugging purposes
    private yaw: number         // yaw to experiment with horizontal rotations
    private speed : number 
    private distance : number
    private t0 : number         // time at t0 in milliseconds
    private t1 : number         // time at t1 in milliseconds
    private t2 : number         // time at t2 in milliseconds for debugging
    private d0 : number         // distance at time t0 in centimeters
    private d1 : number         // distance at time t1 in centimeters
    private r0 : number         // rotations at time t0
    private r1 : number         // rotations at time t1
    private rad0 : number       // radius at t0
    private rad1 : number       // radius at t1
    private base_pos : number   // base position
    private s0: number          // segment at time t0
    private s1: number          // segment at time t1

    constructor() {
        // user defined @creation
        this.radius = 0 
        this._position = Position.Vertical
        this.segments = 1
        this._direction = RotationDirection.Counterclockwise
        // user input @ runtime
        this.runstate = Runstate.Stop
        this.radioOn = true
        this.serialOn = false
        this.dataStream = Stream.MakeCode
        this.avrWindow = 1500
        this.amplitude = 5
        // user output @runtime
        this.kph = 0
        this.kph_min = 1000
        this.kph_max = -1000
        this.kph_avr = 0
        this.kph_cnt = 0
        this._rotations = 0
        this.rpm = 0
        this.rpm_min = 1000
        this.rpm_max = -1000
        this.rpm_avr = 0
        this.rpm_cnt = 0
        // system defined @runtime
        this.acc_x = 0
        this.acc_y = 0
        this.acc_z = 0
        this.yaw = 0
        this.speed = 0
        this.distance = 0
        this.t0 = 0
        this.t1 = 0
        this.t2 = 0
        this.d0 = 0
        this.d1 = 0
        this.r0 = 0
        this.r1 = 0
        this.rad0 = 0
        this.rad1 = 0
        this.base_pos = 0
        this.s0 = 0
        this.s1 = 0
    }

    resetKph () {
        this.kph = 0
        this.kph_min = 1000
        this.kph_max = -1000
        this.kph_avr = 0
        this.kph_cnt = 0
    }

    resetRpm () {
        this.rpm = 0
        this.rpm_min = 1000
        this.rpm_max = -1000
        this.rpm_avr = 0
        this.rpm_cnt = 0
    }

    setRadius(x: number) {
        this.radius = x
    }

 
    /**
     * Meter is Running ?
     */
    //% blockId="speedometer_isRunning"
    //% block="%meter|is running" blockGap=8
    //% s.defl=4 s.min=0 s.max=144
    //% weight=81
    //% parts="speedometer"
    //% group="Info" advanced=true
    isRunning () : boolean {
        return (this.runstate==Runstate.Start || this.runstate==Runstate.Resume)
    }

    /**
     * Set dataStream.
     */
    //% blockId="speedometer_setdataStream"
    //% block="%meter|set datastream format to %d" blockGap=8
    //% s.defl=dataStream.MakeCode
    //% weight=81
    //% parts="speedometer"
    //% group="Data" advanced=true
    setdataStream (d: Stream) {
        this.dataStream=d
    }

    /**
     * Set avrWindow.
     */
    //% blockId="speedometer_setAvrWindow"
    //% block="%meter|set average calculation window to %x milliseconds" blockGap=8
    //% x.defl=1500
    //% weight=81
    //% parts="speedometer"
    //% group="Advanced" advanced=true
    setAvrWindow (x: number) {
        this.avrWindow=x
    }

    /**
     * Set setClockWise.
     */
    //% blockId="speedometer_setRotationDirection"
    //% block="%meter|set wheel direction to clockwise = %c" blockGap=8
    //% c.defl=false
    //% weight=81
    //% parts="speedometer"
    //% group="Advanced" advanced=true
    setRotationDirection (c: RotationDirection) {
        this._direction=c
    }

    /**
     * Set amplitude theshold.
     */
    //% blockId="speedometer_setAmplitude"
    //% block="%meter|set rotation amplitude threshold to %x radians" blockGap=8
    //% x.defl=5
    //% x.min=0 x.max=2*Math.PI
    //% weight=81
    //% parts="speedometer"
    //% group="Advanced" advanced=true
    setAmplitude (x: number) {
        this.amplitude=x
    }

    /**
     * Set position
     */
    //% blockId="speedometer_setPostition" 
    //% block="%meter| set wheel position to %p" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Info" advanced=true
    setPosition (p: Position) {
        this._position=p
    }

    /**
     * Get position
     */
    //% blockId="speedometer_getPostition" 
    //% block="%meter| position" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Info" advanced=true
    get position () : number { 
          return this._position
    }

    calcDistance (radians: number) : number {
        // distance = rotations * circumfence + arc lenght
        return this.rotations * this.circumfence(this.radius) + this.arc(radians, this.radius) - this.base_pos
    }

    /**
     * Get runState.
     */
    //% blockId="speedometer_runState" 
    //% block="%meter | runstate" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Info" advanced=true
    get runState () : Runstate {
        return this.runstate
        }

    /**
     * Get distance.
     */
    //% blockId="speedometer_getDistance" 
    //% block="%meter| distance in %distance" blockGap=8
    //% distance.defl=Distance.Meter
    //% weight=79
    //% parts="speedometer"
    //% group="Distance"
    getDistance (distance: DistanceUnit) : number {
        this.d1=100*1000
        switch (distance) {
            case DistanceUnit.Millimeter: 
                return this.d1 * 10
                break
            case DistanceUnit.Centimeter: 
                return this.d1
                break
            case DistanceUnit.Meter: 
                return this.d1 / 100
                break
            case DistanceUnit.Kilometer: 
                return this.d1 / 100000
                break
            case DistanceUnit.Feet: 
                return this.d1 * 0.03281
                break
            case DistanceUnit.Yard: 
                return this.d1 * 0.01094 
                break
            case DistanceUnit.Mile: 
                return this.d1 * 0.0000062137119223733
                break
            default: return 0 ;
        }
    }

    /**
     * Get segment.
     */
    //% blockId="speedometer_segment" 
    //% block="%meter| segment postition" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Distance", advanced=true
    get segment () : number {
          return this.s1
    }

    /**
     * Get diameter or radius or circumfence.
     */
    //% blockId="speedometer_getDiameter" 
    //% block="%meter|radius, diameter or circumfence = %type" blockGap=8
    //% type.defl=DiameterOrRadius.Circumfence
    //% weight=79
    //% parts="speedometer"
    //% group="Info" advanced=true
    getDiameter (type:DiameterOrRadius) : number {
    switch (type) {
        case DiameterOrRadius.Diameter: 
            return 2 * this.radius
            break
        case DiameterOrRadius.Radius:  
            return this.radius
            break
        case DiameterOrRadius.Circumfence: 
            return 2 * this.radius * Math.PI
            break
        }     
    }
    
    /**
     * Get Speedometer Time running from Start expressed in Milliseconds
     */
    //% blockId="speedometer_time" 
    //% block="%meter| running time" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Info" advanced=true
    get time () : number {
          return this.t1 - this.t0
    }



   
    /**
     * Get rotation from start.
     */
    //% blockId="speedometer_rotations" 
    //% block="%meter|%type|rotations from start" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Rotations"
    get rotations () : number {
            return this._rotations
    }

    /**
     * Get rotation in RPM.
     */
    //% blockId="speedometer_getRpm" 
    //% block="%meter|%type | rotations per minute (Rpm)" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Rotations"
    getRpm (type: ValueType) : number {
         switch (type) {
            case ValueType.Cur: 
                return this.rpm
                break
            case ValueType.Min: 
                return this.rpm_min
                break
            case ValueType.Max: 
                return this.rpm_max
                break
            case ValueType.Avr: 
                return this.rpm_avr
                break
        }
    }

    /**
     * Get speed.
     */
    //% blockId="speedometer_kph" 
    //% block="%meter| %vt | speed in %st" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Speed"
    getKph (vt: ValueType, st: SpeedType) : number {
        let s=0
        switch (vt) {
            case ValueType.Cur: 
                s=this.kph
                break
            case ValueType.Min: 
                s=this.kph_min
                break
            case ValueType.Max: 
                s=this.kph_max
                break
            case ValueType.Avr: 
                s=this.kph_avr
                break
        }
        switch (st) {
            case SpeedType.Kph: 
                return s
                break
            case SpeedType.Mph: 
                return convertKph2Mph(s)
                break
        }
    }

    circumfence (radius: number) : number {
        // returns circumfence of circle, reference: https://en.wikipedia.org/wiki/Circumference
        return 2 * Math.PI * radius
    }

    digits (value: number, nr: number) : number {
        //TODO / fix
        return Math.round(nr * value) / nr
    }


    /**
     * Initialise Meter.
     */
    //% blockId="speedometer_init" 
    //% block="%meter|%type" blockGap=8
    //% type.defl=Runstate.start
    //% weight=100
    //% parts="speedometer"
    //% group="Setup"
      init (type: Runstate) {
        switch (type) {
            case Runstate.Start: {
                // calibrate values to start point
                this.runstate=Runstate.Start
                //
                // set base position
                this.rad1 = Math.atan2(input.acceleration(Dimension.Y), input.acceleration(Dimension.X))
                this.rad0 = this.rad1
                this.base_pos = this.arc(this.rad1, this.radius)
                // reset timer
                this.t1 = input.runningTime()
                this.t0 = this.t1
                // reset distance
                this.d0 = 0
                this._rotations = 0
                this.resetKph()
                this.resetRpm()
                break
            } 
            case Runstate.Stop: {
                this.runstate=Runstate.Stop
                break
            }
            case Runstate.Pause: {
                this.runstate=Runstate.Pause
                break
            }
            case Runstate.Resume: {
                this.runstate=Runstate.Resume
                break
            }
        }
    }

    /**
     * Output to Serial
     */
    //% blockId="speedometer_outputSerial" 
    //% block="%meter|send data insights to serial $on" blockGap=8
    //% on.shadow="toggleOnOff"
    //% on.defl=true
    //% weight=100
    //% parts="speedometer"
    //% group="Data" advanced = true
    outputSerial (on:boolean) {
          this.serialOn = on
    }

        /**
     * Output to Radio
     */
    //% blockId="speedometer_outputRadio" 
    //% block="%meter|send data insights to radio $on" blockGap=8
    //% on.shadow="toggleOnOff"
    //% on.defl=false
    //% weight=100
    //% parts="speedometer"
    //% group="Data" advanced = true
      outputRadio (on:boolean) {
          this.radioOn = on
      }
   
    /**
     * Update Meter.
     */
    //% blockId="speedometer_update" 
    //% block="%meter|updating" blockGap=8
    //% meter.defl=meter
    //% weight=79
    //% parts="speedometer"
    //% group="Setup"
    public update () {
        if (this.isRunning()) {
            //this.updateRadius()
            //this.updateSegment()
            this.updateRotations()
            //this.updateDistance()
            //this.updateSpeed() //frequency of 1 on avrWindow milliseconds
            //this.updateGraph()
        }
    }

    updateRadius () {
        this.rad0 = this.rad1
        this.acc_x= input.acceleration(Dimension.X)
        this.acc_y= input.acceleration(Dimension.Y)
        this.acc_z= input.acceleration(Dimension.Z)
        switch(this.position) {
            case Position.Horizontal:
                this.rad1 = this.getRadiusHorizontal()
                break
            case Position.Vertical:
                this.rad1 = this.getRadiusVertical()
                break
            case Position.Auto:
                if(input.isGesture(Gesture.ScreenUp) || (input.isGesture(Gesture.ScreenDown))) {
                    this.rad1 = this.getRadiusHorizontal()
                }
                else {
                    this.rad1 = this.getRadiusVertical()
                }
            break
        }
        this.t1 = input.runningTime()
    }

    getRadiusVertical (): number {
        const r = -1 * Math.atan2(input.acceleration(Dimension.Y), input.acceleration(Dimension.X))
        return this.clockwise(r)
    }

    getRadiusHorizontal () : number {
        const r = input.compassHeading() * Math.PI/180 -Math.PI
        return this.clockwise(r)
    }

    clockwise (r: number) : number {
        switch(this._direction) {
            case RotationDirection.Clockwise:
                return r
                break
            case RotationDirection.Counterclockwise:
                return -r
                break
        } 
    }


    updateSegment () {
        this.s0 = this.s1
        const p = 2* Math.PI/this.segments
        this.s1 = this.rad1 / p
    }

    updateRotations () {
        // dit was < -1.5 en > 1.5
        if (this.rad1 - this.rad0 < -1 * this.amplitude) {
            this._rotations += 1
        } else if (this.rad1 - this.rad0 > +1 * this.amplitude) {
            this._rotations += -1
        }
        this.r1=this.rotations
    }

    updateDistance () {
        // all distances are expressed in centimeters
        this.d1 = this.calcDistance(this.rad1)
    }

    updateSpeed () {
        if (this.t1 - this.t0 > this.avrWindow) {
            const elapsedSeconds = ((this.t1 - this.t0) / 1000) // elapsed seconds
            const cps = (this.d1 - this.d0) / elapsedSeconds    // centimeters per second
            const mps = cps / 100                               // meters per second
            const mph = mps * 3600                              // meters per hour
            const kph = mph / 1000                              // kilometer per hour
            this.kph_avr=cumulativeMovingAverage(kph, this.kph_avr, this.kph_cnt+=1)
            this.kph_min=Math.min(kph,this.kph_min)
            this.kph_max=Math.max(kph,this.kph_max)
            this.kph = kph

            // update RPM
            const rps=mps / this.circumfence(this.radius)        // rotations per second
            const rpm=rps*60                                     // rotations per minute
            this.rpm_avr=cumulativeMovingAverage(rpm, this.rpm_avr, this.rpm_cnt+=1)
            this.rpm_min=Math.min(rpm,this.rpm_min)
            this.rpm_max=Math.max(rpm,this.rpm_max)
            this.rpm=rpm

            // update timer
            this.t0 = this.t1
            // update sliding distance window
            this.d0 = this.d1
            // update sliding rotation window
            this.r0 = this.r1
        }
    }

/*
    updateGraph () {
        if ((this.radioOn || this.serialOn) && (this.isRunning())) {
          //  this.sendData("t0",this.t0)

         //    this.sendData("t1",this.t1) 
         //    this.sendData("t1",this.t1-this.t2) 
            this.sendData("t2",this.yaw)
        //    this.t2=this.t1
        //    this.sendData("acc_x", this.acc_x)
        //    this.sendData("acc_y", this.acc_y)
        //    this.sendData("acc_z", this.acc_z)
            this.sendData("radius", this.rad1)
            this.sendData("rotation", this.rotations) // sendData seems to be limited to 8 chars: s rotation and not rotations
        //    this.sendData("distance", this.d1)
        //    this.sendData("rpm", this.rpm)
        //  this.sendData("rpm_min", this.rpm_min)
        //  this.sendData("rpm_max", this.rpm_max)
        //  this.sendData("rpm_avr", this.rpm_avr)
        //  this.sendData("kph", this.kph)
        //  this.sendData("kph_min", this.kph_min)
        //  this.sendData("kph_max", this.kph_max)
        //  this.sendData("kph_avr", this.kph_avr)
        //  if (this.dataStream == Stream.DataStreamer) {
        //      this.sendData("eol", 1) 
        //  }
        }
    }
    */
    
    /*
    sendData (text: string, num: number) {
        if(this.serialOn) {
            serial.writeValue(text, this.digits(num, 100))
        } 
        if (this.radioOn) {
            //removed the radioo
        }
        basic.pause(5)
    }
    */

    arc (radians: number, radius: number) {
    // returns arc length, reference: https://en.wikipedia.org/wiki/Arc_(geometry)
    return radians * radius
    }
}

/**
 * Create a new Meter for `diameter` circumfence of circle
 * @param diameter the diameter of the circle, eg: 28 inch
 */
//% blockId="speedometer_create" 
//% block="wheel %type of %x %units||running %p|rotating %c|covering %s segments"
//% inlineInputMode=inline
//% x.defl=28
//% s.defl=1
//% units.defl=Units.Inches
//% weight=2000
//% parts="speedometer"
//% group="Setup"
//% trackArgs=0,2
//% blockSetVariable=meter
export function create(type: DiameterOrRadius, x: number, units: Units, p?:Position, c?: RotationDirection,s?:number): Meter {
    let meter = new Meter();
    meter.setRotationDirection(c)
    switch (p) {
        case Position.Vertical: 
            meter.setPosition(Position.Vertical)
            break
        case Position.Horizontal: 
            meter.setPosition(Position.Horizontal)
            break
    }
    let r = 0
    switch (type) {
        case DiameterOrRadius.Diameter: 
            r=x/2
            break
        case DiameterOrRadius.Radius:  
            r=x
            break
        case DiameterOrRadius.Circumfence: 
            r=x/(2*Math.PI)
            break
    }
    switch (units) {
        case Units.Centimeters: 
            meter.setRadius(r)
            break
        case Units.Inches: 
            meter.setRadius(convertInch2Centimeter(r))
            break
    }
     return meter
}

    /**
     * Show bikespeed.
     */
    //% blockId="speedometer_plotAt" 
    //% block="show speed %index" blockGap=8
    //% weight=79
    //% parts="speedometer"
    //% group="Setup"
    export function plotAt (index: number) {
        basic.clearScreen()
        index |= 0
        for(let i = 0; i < index; i++) {
            const y = Math.floor(index / 5)
            const x = Math.floor(index % 5)
            led.plot(x, y)
        }
    }

}

// USED
    function convertInch2Meter (inch: number) : number {
        // converts inches to metric (1 inch = 25.4 mm, 2.54 cm, 0,0254m), reference: https://en.wikipedia.org/wiki/I
        return inch * 0.0254
    }

    function cumulativeMovingAverage(x: number, avr: number, cnt:number,) : number {
        // https://en.wikipedia.org/wiki/Moving_average
        return avr+((x-avr)/cnt)
    }

    function convertKph2Mph (k: number) : number {
        // converts Kph to Mph: 1 kph to mph = 0.62137 mph, reference: https://www.convertunits.com/from/kph/to/mph
        return k * 0.62137
    }

// NOT USED

    function convertInch2Centimeter (inch: number) : number {
        // converts inches to metric (1 inch = 25.4 mm, 2.54 cm, 0,0254m), reference: https://en.wikipedia.org/wiki/I
        return inch * 2.54
    }

    function convertMeter2Inch (meter: number) : number {
        // 1m in inches = 39.37007874 inches
        return meter * 39.37007874
    }
  
    function convertCentimeter2Inch (centimeter: number) : number {
        //  1cm in inches = 0.3937008in
        return centimeter * 0.3937008
    }








/**
 * Author: Peter Heldens, 25- okt 2020
 * 
 * NodeRed Extension to experiment with:
 * - Azure IoT Digital Twins
 * - Telemetry, Cloud2Device (C2D), Device2Cloud (D2C)
 * - NodeRed & Dashboards
 * 
 * It supports multiple microbits Leaf Nodes (EndPoints) and one (1) microbit Gateway.
 * - Leaf Nodes use Radio to communicate with the Gateway.
 * - Gateway Node use Serial communication to a serial device (Node-Red server).
 * - Leaf Nodes respond to Gateway (after Gateway initiated a HandShake).
 * 
 * Leaf Nodes respond to Gateway by:
 * - sending Telemetry, Properties, Commands to the Gateway
 * - receiving C2D commands from the Gateway
 * - executing C2D commands targeted to the specific Leaf Node
 *  
 * GateWay Node orchestrates:
 * - radio communication to Leaf Nodes using HandShakes
 * - serial communication to Node-Red server (Any PC/Android/RaspberryPi)
 * 
 *  tips to create blocks:
 *  https://makecode.microbit.org/blocks/custom
 *  https://makecode.com/playground
 * 
 * TODO: 
 * [0] change radio.sendValue to radioSendCommand /w value limit to 8 chars
 * [0] remove init_log 
 * [x] gateway: enable property
 * [x] endpoint: enable telemetry switch for EndPoint
 * [0] endpoint: remove debug
 * [0] gateway: make register/unregister work the same as for the endpoint? or rename to register endpoint
 * [x] gateway: make submit property name = work the same as for Mode.EndPoint
 * [0] change IoT icon to some IoT hub or Radio account
 * [x] enable/disable properties (digital write, analog write, accelerometer,etc.)
 * [0] Azure IoT hub connectivity:
 * [0] sending telemetry to Azure IoT Hub
 * [0] receiving and responding to direct messages coming from Azure
 * [0] receiving and responding to desired properties using the Device Twin
 * [0] updating reported properties in the Device Twin
 * [0] receiving and responding to C2D messages (commands)
 */

enum Mode {
    EndPoint,
    Gateway
}

//% groups="['Gateway','EndPoint','General','Advanced"]"

//% weight=100 color=#0fbc11 icon=""
namespace IoT {
    export class Property {
        name: string
        value : number

        constructor(name:string, value: number) {
            this.name = name
            this.value = value
        }

        //% block="%property | value"
        //% group="General"
        get() : number {
            return this.value;
        }

        //% block="%property set value to %v"
        //% v.defl=0
        //% group="General"
        set(v:number) {
            this.value = v;
        }

        //% block="%property change value by %v"
        //% v.defl=0
        //% group="General"
        update(v:number) {
            this.set(this.value+v);
        }
        
    }
    export let propertyArray: Property[] = []
        
        //% block="create property|name %name|value %value"
        //% value.defl=0
        //% value.defl=counter
        //% blockSetVariable=property
        //% group="General"
        export function create(name:string, value: number): Property {
            let p = new Property(name, value);
            propertyArray.push(p);
            return p
            }

    //////////////////
    // Start IoT_gateway
    //////////////////
    let deviceMode = Mode.Gateway
    let showDebug = true
    let doTelemetry = true

    //init D2C data

    const init_telemetry    = "{\"topic\":\"telemetry\"}"
    const init_property     = "{\"topic\":\"property\"}"
    const init_log          = "{\"topic\":\"device_log\"}"

/* experiment
    const init_telemetry    = "{\"topic\":\"telemetry\", \"payload\":{"
    const init_property     = "{\"topic\":\"property\", \"payload\":{"
    const init_log          = "{\"topic\":\"device_log\", \"payload\":{"
*/
    let device_telemetry    : string[] = []
    let device_property     : string[] = []
    let device_log          : string[] = []

    //init EndPoint array
    let device_registrar: number[] = []

    //init packet_loss
    let packet_loss = 0

    //init timers
    let timerRadioRequest = 0
    let timerGatewayRequest = 0

    let microbit_ID = 0 // this is the index of the EndPoint to be processed using the HandShake
    let delay = 20
    let activeRadioRequest = false

    //init Radio
    radio.setTransmitPower(7)
    radio.setGroup(101)
    radio.setTransmitSerialNumber(true)

    //% block="start IoT node as $mode"
    //% weight=100
    //% group="Gateway"
    export function setDeviceMode(mode: Mode) {
        switch (mode) {
            case Mode.EndPoint: {
                deviceMode=Mode.EndPoint
                //EndPoint device with identity = -1 (unregistered to Gateway)
                identity=-1
                break;
            }
            case Mode.Gateway: {
                deviceMode=Mode.Gateway
                //Gateway device with identity = 0 (register to Gateway)
                identity=0
                addMicrobit(control.deviceSerialNumber())
            }
        }
    }

    //% block="set debug mode $on"
    //% group="Gateway"
    //% weight=10
    //% on.shadow="toggleOnOff"
    export function enableDebug(on: boolean) {
        showDebug = on;
    }

    //%block="telemetry $b"
    //% group="General"
    //% weight=80
    //% b.shadow="toggleOnOff"
    export function sendTelemetry(b: boolean) {
        doTelemetry = b
    }

    //% block
    //% weight=50
    //% group="Gateway"
    export function runGatewayOrchestrator (): void {
        if (deviceMode==Mode.Gateway) {
            //debug("start orchestration ...")
            //debug("activeRadioRequest = " + activeRadioRequest)
            if (activeRadioRequest) {
                if (input.runningTime() > timerRadioRequest) {
                    //packet loss detected
                    packet_loss += 1
                    debug("packet_loss", packet_loss)
                    request_next_mb()
                } else {
                    //processing incoming radio data in other treat
                    //debug("processing incoming radio data")
                } 
            }
            if (!(activeRadioRequest)) {
            //start new request
            //debug("start new request")
            request_next_mb()
            }
        }
    }

    function radioSendMessage(m: string) {
        if (m.length <=19) {
            radio.sendString(m)
        } else {
            basic.showString("m>19")
            basic.pause(10000)
            //TODO - log error to console here
        }
    }
  
    function request_next_mb () {
        // request data from the next microbit using handshake & round robin
        if (deviceMode==Mode.Gateway) {
            microbit_ID = (microbit_ID + 1) % device_registrar.length
            debug("request next microbit",microbit_ID)
            if (device_telemetry[microbit_ID] != null) {
                if (microbit_ID == -1) {
                    // The EndPoint not initialised
                    debug("exception > device_telemetry["+microbit_ID+"] = -1")
                }
                if (microbit_ID == 0) {
                    // The EndPoint is the Gateway 
                    debug("request data from gateway")
                    setTimerGatewayRequest()
                    gatewaySubmitTelemetry()
                    gatewaySubmitProperty()
                }
                if (microbit_ID > 0)  {
                    // The EndPoint is one of the radio connected microbits
                    debug("request data from remote IoT microbit")
                    debug("send token", device_registrar[microbit_ID])
                    setTimerRadioRequest()
                    activeRadioRequest = true
                    radio.sendValue("token", device_registrar[microbit_ID])
                }
            } else {
                debug("exception > device_telemetry["+microbit_ID+"] = null")
            }
        }
    }

    function gatewaySubmitTelemetry() {
        // gateway to submit telemetry
        if (deviceMode==Mode.Gateway) {
            if (doTelemetry) {
                debug("submit gateway telemetry data")
                let sn=control.deviceSerialNumber()
                gatewaySendTelemetry(sn,"id", 0)
                gatewaySendTelemetry(sn,"sn", sn)

                gatewaySendTelemetry(sn,"time", input.runningTime())
                gatewaySendTelemetry(sn,"packetLoss", packet_loss)
                gatewaySendTelemetry(sn,"signal", 100)
                if (doTemperature) {
                    gatewaySendTelemetry(sn,"temperature", input.temperature())
                }
                if(doLightLevel) {
                    gatewaySendTelemetry(sn,"lightLevel", input.lightLevel())
                }
                if (doAccelerometer) {
                    gatewaySendTelemetry(sn,"accelerometerX", input.acceleration(Dimension.X))
                    gatewaySendTelemetry(sn,"accelerometerY", input.acceleration(Dimension.Y))
                    gatewaySendTelemetry(sn,"accelerometerZ", input.acceleration(Dimension.Z))
                    gatewaySendTelemetry(sn,"accelerometerS", input.acceleration(Dimension.Strength))
                }
                if (doMagneticForce) {
                    gatewaySendTelemetry(sn,"magneticForceX", input.magneticForce(Dimension.X))
                    gatewaySendTelemetry(sn,"magneticForceY", input.magneticForce(Dimension.Y))
                    gatewaySendTelemetry(sn,"magneticForceZ", input.magneticForce(Dimension.Z))
                    gatewaySendTelemetry(sn,"magneticForceS", input.magneticForce(Dimension.Strength))
                }
                if (doRotation) {
                    gatewaySendTelemetry(sn,"rotationPitch", input.rotation(Rotation.Pitch))
                    gatewaySendTelemetry(sn,"rotationRoll", input.rotation(Rotation.Roll))
                }
                if (doCompass) {
                     gatewaySendTelemetry(sn,"compass", 1)
                }
                if (doDigitalRead) {
                    gatewaySendTelemetry(sn,"digitalPinP0", pins.digitalReadPin(DigitalPin.P0))
                    gatewaySendTelemetry(sn,"digitalPinP1", pins.digitalReadPin(DigitalPin.P1))
                    gatewaySendTelemetry(sn,"digitalPinP2", pins.digitalReadPin(DigitalPin.P2))
                }
                if (doAnalogRead) {
                    gatewaySendTelemetry(sn,"analogPinP0", pins.analogReadPin(AnalogPin.P0))
                    gatewaySendTelemetry(sn,"analogPinP1", pins.analogReadPin(AnalogPin.P1))
                    gatewaySendTelemetry(sn,"analogPinP2", pins.analogReadPin(AnalogPin.P2))
                }
                gatewaySendTelemetry(sn,"eom", 1)
            }
        }
    }

    function gatewaySubmitProperty () {
        // gateway to submit property
        // send device property value pairs to the cloud
        // value pair: (name, value) = (propSting, propValue)
        if (deviceMode==Mode.Gateway) { 
            if ((doProperty) && (propertyArray.length > 0)) {
                const sn = control.deviceSerialNumber()
                gatewaySendProperty(sn,"id", microbit_ID)
                for (let i=0; i<propertyArray.length;i++) { 
                    const n = propertyArray[i].name
                    const v = propertyArray[i].value
                    gatewaySendProperty(sn,n,v)
                }   
                gatewaySendProperty(sn,"eom", 1)
            }
        }
    }


 
    function delMicrobit (sn: number) {
        if (deviceMode==Mode.Gateway) {
            //TODO - continue here ...
            debug("delMicrobit() > sn", sn)
            const id = device_registrar.indexOf(sn)
            const setIdentityCmd = "sid(-1," + sn + ")"
            debug("delMicrobit() > id", id)
            if (id >= 0) {
                if (device_telemetry[id] != null) { // TODO:veranderen in functie die zegt of device active is
                    device_telemetry[id] = null
                    radioSendMessage(setIdentityCmd)
                    debug("delMicrobit > radio.sendString > sid(-1,sn)", sn)
                }
            }
        }
    }

    function debug(s: string, v?: number) {
        // send Gateway debug info as JSON string from to ComPort
        if (deviceMode==Mode.Gateway) {
            if (showDebug) {
                const topic = "{\"topic\":\"debug\","
                const t1 = ""+ "\"debug\": \"" + s
                let v1=""
                if (v != null) {
                    v1 = " = " + v + "\"}"
                } else {
                    v1 = "\"}"
                }
                serial.writeLine(topic + t1 + v1)
                basic.pause(20)
                //serial.writeLine("")
                //basic.pause(20)
            }
        }
    }

    function addMicrobit (sn: number) {
        // add EndPoint device to the device registrar
        if (deviceMode==Mode.Gateway) {
            const id = device_registrar.indexOf(sn)
            //const setIdentityCmd = "sid(" + id + "," + sn + ")"
            debug("addMicrobit("+sn+")")
            debug("id",id)
            if (id < 0) {
                debug("id < 0")
                // device does not exist yet, add new device
                device_registrar.push(sn)
                device_telemetry.push(init_telemetry)
                device_property.push(init_property)
                device_log.push(init_log)
                // we have a new id now ...
                const newId = device_registrar.indexOf(sn)
                radioSendMessage("sid(" + newId + "," + sn + ")")
                debug("sid(" + newId + "," + sn + ")")
                setTimerRadioRequest(1000)
                setTimerGatewayRequest(1000)
                basic.pause(500)  //TODO dit kan weg?
            } else {
                /*
                debug("id >= 0") 
                // device exists already, device_telemetry=null, reactivate it by setting device_telemetry to "{"
                device_telemetry[id] = init_telemetry
                //debug("init_telemetry["+id+"] = "+device_telemetry[id] )
                debug(setIdentityCmd)
                radioSendMessage(setIdentityCmd)
                debug(setIdentityCmd)
                setTimerRadioRequest(10000)  //TO reduce this
                basic.pause(500)
                */
            }
        }
    }


    radio.onReceivedValue(function (name, value) {
        if (deviceMode==Mode.Gateway) {
            debug("radio.onReceivedValue(" + name + "," + value + ")")
            setTimerRadioRequest() // waarom is dit nog nodig ?
            const sn = radio.receivedPacket(RadioPacketProperty.SerialNumber)
            debug("radio.onReceivedValue() > sn",sn)
            if((name=="register") || (name=="del")) {
                if (name == "register") {
                        addMicrobit(sn) // hier stond sn
                } else if (name == "del") {
                        delMicrobit(sn)
                }
            } else {
                const id = device_registrar.indexOf(sn)
                debug("radio.onReceivedValue() > id",id)
                led.plot(id, 3)
                if (name == "id") { //id=identity
                    gatewaySendTelemetry(sn, "id", value)
                } else if (name == "lid") { //lid=leafIdentity
                    gatewaySendProperty(sn, "id", value)
                } else if (name == "sn") {
                    gatewaySendTelemetry(sn, "sn", sn) //waarom abs ?
                } else if (name == "time") {
                    gatewaySendTelemetry(sn, "time", radio.receivedPacket(RadioPacketProperty.Time))
                } else if (name == "packet") {
                    gatewaySendTelemetry(sn, "packetLoss", packet_loss)
                } else if (name == "signal") {
                    gatewaySendTelemetry(sn, "signalStrength", radio.receivedPacket(RadioPacketProperty.SignalStrength))
                } else if (name == "light") {
                    gatewaySendTelemetry(sn, "lightLevel", value)
                } else if (name == "accX") {
                    gatewaySendTelemetry(sn, "accelerometerX", value)
                } else if (name == "accY") {
                    gatewaySendTelemetry(sn, "accelerometerY", value)
                } else if (name == "accZ") {
                    gatewaySendTelemetry(sn, "accelerometerZ", value)
                } else if (name == "accS") {
                    gatewaySendTelemetry(sn, "accelerometerS", value)
                } else if (name == "magX") {
                    gatewaySendTelemetry(sn, "magneticForceX", value)
                } else if (name == "magY") {
                    gatewaySendTelemetry(sn, "magneticForceY", value)
                } else if (name == "magZ") {
                    gatewaySendTelemetry(sn, "magneticForceZ", value)
                } else if (name == "magS") {
                    gatewaySendTelemetry(sn, "magneticForceS", value)
                } else if (name == "rotP") {
                    gatewaySendTelemetry(sn, "rotationPitch", value)
                } else if (name == "rotR") {
                    gatewaySendTelemetry(sn, "rotationRoll", value)
                } else if (name == "comp") {
                    gatewaySendTelemetry(sn, "compass", value)
                } else if (name == "dP0") {
                    gatewaySendTelemetry(sn, "digitalPinP0", value)
                } else if (name == "dP1") {
                    gatewaySendTelemetry(sn, "digitalPinP1", value)
                } else if (name == "dP2") {
                    gatewaySendTelemetry(sn, "digitalPinP2", value)
                } else if (name == "aP0") {
                    gatewaySendTelemetry(sn, "analogPinP0", value)
                } else if (name == "aP1") {
                    gatewaySendTelemetry(sn, "analogPinP1", value)
                } else if (name == "aP2") {
                    gatewaySendTelemetry(sn, "analogPinP2", value)
                } else if (name == "temp") {
                    gatewaySendTelemetry(sn, "temperature", value)
                } else if (name == "eom") {
                    gatewaySendTelemetry(sn, "eom", value)
                    gatewaySendProperty(sn, "eom", value) // TODO: klopt dit wel?
                    //gatewaySendLog(sn, "eom", value)
                    activeRadioRequest = false
                } else if (name.substr(0, 2) == "d:") {
                    // debug/log data
                    //gatewaySendLog(sn, name.substr(2,name.length), value)
                } else {
                    // property data
                    gatewaySendProperty(sn, name, value)
                }
                led.unplot(id, 3)
            }
        }
        //incoming Handshake request from Gateway to deliver D2C Telemetry, etc.
        if (deviceMode==Mode.EndPoint) {
            if (identity >= 0) {
                if (name == "token" && value == control.deviceSerialNumber()) {
                    leafSendTelemetry()
                    leafSendProperty()
                    //leafSendDebug()
                    leafSendEndOfMessage()
                }
            }
        }
    })

    function gatewaySendProperty (sn: number, text: string, num: number) {
        // assemble data object and send as JSON String to ComPort
        if (deviceMode==Mode.Gateway) {
            microbit_ID = device_registrar.indexOf(sn)
            debug("ID="+microbit_ID+" sn="+sn+" property("+text+","+num+")")
            let JSON = device_property[microbit_ID]
            if (JSON.includes("}")) {
                JSON = JSON.substr(0, JSON.length - 1)
                JSON = "" + JSON + ","
            }
            if (true) {
                JSON = "" + JSON + "\"" + text + "\"" + ":" + num + "}"
            } else {
                debug("skipped: " + text + ":" + num)
            }
            if (JSON.includes("eom")) {
                debug("eom property")
                led.plot(device_registrar.indexOf(sn), 4)
                serial.writeLine(JSON)
                basic.pause(delay)
                //serial.writeLine("")
                //basic.pause(delay)
                led.unplot(device_registrar.indexOf(sn), 4)
                JSON = init_property
            } 
            device_property[microbit_ID] = JSON
        }
    }

    function gatewaySendLog (sn: number, text: string, num: number) {
        // assemble data object and send as JSON String to ComPort
        if (deviceMode==Mode.Gateway) {
            microbit_ID = device_registrar.indexOf(sn)
            debug("ID="+microbit_ID+" sn="+sn+" log("+text+","+num+")")
            let JSON = device_log[microbit_ID]
            if (JSON.includes("}")) {
                JSON = JSON.substr(0, JSON.length - 1)
                JSON = "" + JSON + ","
            }
            if (true) {
                JSON = "" + JSON + "\"" + text + "\"" + ":" + num + "}"
            } else {
                debug("skipped: " + text + ":" + num)
            }
            if (JSON.includes("eom")) {
                debug("eom log")
                led.plot(device_registrar.indexOf(sn), 4)
                serial.writeLine(JSON)
                basic.pause(delay)
                //serial.writeLine("")
                //basic.pause(delay)
                led.unplot(device_registrar.indexOf(sn), 4)
                JSON = init_log
            }
            device_log[microbit_ID] = JSON
        }
    }

        function gatewaySendTelemetryExperiment (sn: number, text: string, num: number) {
        // assemble data object and send as JSON String to ComPort
        if (deviceMode==Mode.Gateway) {
            //microbit_ID = device_registrar.indexOf(sn)
            //debug("ID="+microbit_ID+" telemetry("+text+","+num+")")
            let JSON=""
            JSON = device_telemetry[microbit_ID]
            /*
            if (JSON.includes("}")) {
                JSON = JSON.substr(0, JSON.length - 1)
                JSON = "" + JSON + ","
            }
            */
            if (JSON.includes("id") || text == "id") {
                JSON = "" + JSON + "\"" + text + "\"" + ":" + num + ","
            } else {
                debug("skipped: " + text + ":" + num)
            }
            if (JSON.includes("eom")) {
                JSON = JSON.substr(0, JSON.length - 9) // 9=length of ,"eom":1,
                JSON = "" + JSON + "}}"
                //debug("eom telemetry")
                led.plot(device_registrar.indexOf(sn), 4)
                serial.writeLine(JSON)
                basic.pause(delay)
                //serial.writeLine("")
                //basic.pause(delay)
                led.unplot(device_registrar.indexOf(sn), 4)
                JSON = init_telemetry
            }
            device_telemetry[microbit_ID] = JSON
        }
    }

    function gatewaySendTelemetry (sn: number, text: string, num: number) {
        // assemble data object and send as JSON String to ComPort
        if (deviceMode==Mode.Gateway) {
            microbit_ID = device_registrar.indexOf(sn)
            debug("ID="+microbit_ID+" telemetry("+text+","+num+")")
            let JSON=""
            JSON = device_telemetry[microbit_ID]
            if (JSON.includes("}")) {
                JSON = JSON.substr(0, JSON.length - 1)
                JSON = "" + JSON + ","
            }
            if (JSON.includes("id") || text == "id") {
                JSON = "" + JSON + "\"" + text + "\"" + ":" + num + "}"
            } else {
                debug("skipped: " + text + ":" + num)
            }
            if (JSON.includes("eom")) {
                //debug("eom telemetry")
                led.plot(device_registrar.indexOf(sn), 4)
                serial.writeLine(JSON)
                basic.pause(delay)
                //serial.writeLine("")
                //basic.pause(delay)
                led.unplot(device_registrar.indexOf(sn), 4)
                JSON = init_telemetry
            }
            device_telemetry[microbit_ID] = JSON
        }
    }

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        //receive C2D commands from ComPort
        if (deviceMode==Mode.Gateway) {
            const serialRead = serial.readUntil(serial.delimiters(Delimiters.NewLine))
            debug("serial.onDataReceived() > serialRead ="+ serialRead)
            if (!(serialRead.isEmpty())) {
                const t0 = serialRead.split(":")
                // C2D command is generic to all EndPoint devices
                if (t0.length == 1) {
                    processC2D(serialRead) //TODO: alleen als doCommands=true?
                    //radio.sendString(serialRead)
                    radioSendMessage(serialRead)
                    debug("serial.onDataReceived() > radio.sendString("+ serialRead+")")
                }
                if (t0.length == 2) {
                // C2D command is for specific named EndPoint devices (n; 0<n<N)
                    const t1 = t0[0].split(",")
                    for (let i = 0; i <= t1.length - 1; i++) {
                        // convert EndPoint devices N:1 
                        const cmd = "" + t1[i] + ":" + t0[1]
                        processC2D(cmd) //TODO: alleen als doCommands=true?
                        //radio.sendString(cmd)
                        radioSendMessage(cmd)
                        debug("serial.onDataReceived() > radio.sendString("+cmd+")")
                        basic.pause(20)
                    }
                }
            }
        }
    })

    function setTimerRadioRequest (t?:number) {
        if (deviceMode==Mode.Gateway) {
            const v = t || 400
            timerRadioRequest = input.runningTime() + v
            //debug("resetTimerRadioRequest", timerRadioRequest)
        }
    }

    function setTimerGatewayRequest (t?:number) {
        if (deviceMode==Mode.Gateway) {
            const v = t || 250
            timerGatewayRequest = input.runningTime() + v
            //debug("resetTimerGatewayRequest",timerGatewayRequest)
        }
    }

    
    ///////////////////
    // End IoT Gateway
    ///////////////////


    ///////////////////
    // Start IoT Client
    ///////////////////
    let radioGroup = 101
    export let identity = -1
    let doProperty = true
    let doD2C = true
    let doDebug = true
    let propString: string[] = []
    let propValue: number[] = []
    let doAccelerometer = true
    let doMagneticForce = true
    let doRotation = true
    let doDigitalRead = false
    let doAnalogRead = false
    let doCompass = false
    let doTemperature = true
    let doLightLevel = true

    //%block="submit property | name = $p | value = $v"
    //% weight=100
    //% group="General"
    export function addProperty(p: string, v:number) {
        // add digital twin reported.property
        // add (name, value) pair to array of (propSting, propValue)
        // https://stackoverflow.com/questions/1750106/how-can-i-use-pointers-in-java
        const index = propString.indexOf(p)
        if ( index < 0) {
            // we have a new value pair
            propString.push(p)
            propValue.push(v)
        } else {
            // we have an existing value pair, don't add this one...
            // current implementation overwrites existing value pair 
            // the following 2 statements might be deleted (as it is overwrite existing strip.show())
            propString[index] = p
            propValue[index] = v
        }    
    }
    // TODO - pseudo code
    // for each object in property array
    // submit object.value

    function leafSendProperty () {
        // send device property value pairs to the cloud
        // value pair: (name, value) = (propSting, propValue)
        if (deviceMode==Mode.EndPoint) { 
            if ((doProperty) && (propertyArray.length > 0)) {
                radio.sendValue("lid", identity)
                for (let i=0; i<propertyArray.length;i++) { 
                    const p=propertyArray[i]
                    radio.sendValue(p.name, p.value)
                    basic.pause(delay)
                }   
            }
        }
    }


    //%block="property $b"
    //% group="General"
    //% b.shadow="toggleOnOff"
    export function sendProperty(b: boolean) {
        doProperty = b
    }

    //%block="accelerometer $b"
    //% group="Advanced" advanced=true
    //% b.shadow="toggleOnOff"
    export function sendAccelerometer(b: boolean) {
        doAccelerometer = b
    }

    //%block="magnetic force $b"
    //% group="Advanced" advanced=true
    //% b.shadow="toggleOnOff"
    export function sendMagneticForce(b: boolean) {
        doMagneticForce = b
    }

    //%block="rotation $b"
    //% group="Advanced" advanced=true
    //% b.shadow="toggleOnOff"
    export function sendRotation(b: boolean) {
        doRotation = b
    }

    //%block="analog read $b"
    //% group="Advanced" advanced=true
    //% b.shadow="toggleOnOff"
    export function sendAnalogRead(b: boolean) {
        doAnalogRead = b
    }

    //%block="digital read $b"
    //% group="Advanced" advanced=true
    //% b.shadow="toggleOnOff"
    export function sendDigitalRead(b: boolean) {
        doDigitalRead = b
    }

     //%block="temperature $b"
    //% group="Advanced" advanced=true
    //% b.shadow="toggleOnOff" default=On
    export function sendTemperature(b: boolean) {
        doTemperature = b
    }

    //%block="light level $b"
    //% group="Advanced" advanced=true
    //% b.shadow="toggleOnOff"
    export function sendLightLevel(b: boolean) {
        doLightLevel = b
    }

    //%block="compass $b"
    //% group="Advanced" advanced=true
    //% b.shadow="toggleOnOff"
    export function sendCompass(b: boolean) {
        doCompass = b
    }

    //% block
    //% weight=100
    //% group="EndPoint"
    export function registerDevice () {
        basic.clearScreen()
        if (identity < 0) {
            radio.sendValue("register", 0)
            /*
            while (identity < 0) {
                radio.sendValue("register", control.deviceSerialNumber())
                led.toggle(2, 2)
                basic.pause(1000)
            }
            */
        } else {
            basic.showString("already registered")
        }
        basic.clearScreen()
        who()
    }
    //% block
    //% weight=50
    //% group="EndPoint"
    export function unregisterDevice () {
        basic.clearScreen()
        if (identity >= 0) {
            radio.sendValue("del", control.deviceSerialNumber())
            led.toggle(2, 2)
            basic.pause(1000)
        } else {
            basic.showString("already deleted")
        }
    }

    function leafSendTelemetry () {
        // send telemetry from Leave Device to the Gateway Device
        if (deviceMode==Mode.EndPoint) {
            if (doTelemetry) {
                radio.sendValue("id", identity)
                basic.pause(delay)
                radio.sendValue("sn", 0)
                basic.pause(delay)
                radio.sendValue("time", 0)
                basic.pause(delay)
                radio.sendValue("packet", 0)
                basic.pause(delay)
                radio.sendValue("signal", 0)
                basic.pause(delay)
                if (doTemperature) {
                    radio.sendValue("temp", input.temperature())
                    basic.pause(delay)
                }
                if(doLightLevel) {
                    radio.sendValue("light", input.lightLevel())
                    basic.pause(delay)
                }
                if (doAccelerometer) {
                    radio.sendValue("accX", input.acceleration(Dimension.X))
                    basic.pause(delay)
                    radio.sendValue("accY", input.acceleration(Dimension.Y))
                    basic.pause(delay)
                    radio.sendValue("accZ", input.acceleration(Dimension.Z))
                    basic.pause(delay)
                    radio.sendValue("accS", input.acceleration(Dimension.Strength))
                    basic.pause(delay)
                }
                if (doMagneticForce) {
                    radio.sendValue("magX", input.magneticForce(Dimension.X))
                    basic.pause(delay)
                    radio.sendValue("magY", input.magneticForce(Dimension.Y))
                    basic.pause(delay)
                    radio.sendValue("magZ", input.magneticForce(Dimension.Z))
                    basic.pause(delay)
                    radio.sendValue("magS", input.magneticForce(Dimension.Strength))
                    basic.pause(delay)
                }
                if (doCompass) {
                    radio.sendValue("comp", 1)
                    basic.pause(delay)
                }
                if (doDigitalRead) {
                    radio.sendValue("dP0", pins.digitalReadPin(DigitalPin.P0))
                    basic.pause(delay)
                    radio.sendValue("dP1", pins.digitalReadPin(DigitalPin.P1))
                    basic.pause(delay)
                    radio.sendValue("dP2", pins.digitalReadPin(DigitalPin.P2))
                    basic.pause(delay)
                }
                if (doAnalogRead) {
                    radio.sendValue("aP0", pins.analogReadPin(AnalogPin.P0))
                    basic.pause(delay)
                    radio.sendValue("aP1", pins.analogReadPin(AnalogPin.P1))
                    basic.pause(delay)
                    radio.sendValue("aP2", pins.analogReadPin(AnalogPin.P2))
                    basic.pause(delay)
                }
            }
        }    
    }

    function leafSendEndOfMessage () {
        if (deviceMode==Mode.EndPoint) {
            radio.sendValue("eom", 1)
            basic.pause(delay)
        }
    }

    function leafSendDebug () {
        // send debug info to the cloud
        if (deviceMode==Mode.EndPoint) {
            if (doDebug) {
                radio.sendValue("d:id", identity)
                basic.pause(delay)
            }
        }
    }

    radio.onReceivedString(function (receivedString) {
        //incoming request from Gateway with new C2D request
        if (deviceMode==Mode.EndPoint) {
            doCommands = true //TODO: kan dit niet gewoon weg ? Was voor handshake ...
            processC2D(receivedString)
        }
    })

/*
    radio.onReceivedValue(function (name, value) {
        //incoming Handshake request from Gateway to deliver D2C Telemetry, etc.
        if (deviceMode==Mode.EndPoint) {
            if (identity >= 0) {
                if (name == "token" && value == control.deviceSerialNumber()) {
                    leafSendTelemetry()
                    leafSendProperty()
                    //leafSendDebug()
                    leafSendEndOfMessage()
                }
            }
        }
    })
*/

   
    /////////////////
    // End IoT Client
    /////////////////


    /////////////////////
    // Start IoT Commands
    /////////////////////

    // doCommands is a global variable for HandShakeset in radio.onReceivedString(function (receivedString))
    let doCommands = true //TODO: Stond op false, waarschijnlijk voor leaf

    // define NeoPixel Strip
    /*
    let strip: neopixel.Strip = null
    strip = neopixel.create(DigitalPin.P1, 10, NeoPixelMode.RGB)
    strip.clear()
    strip.show()
    */

    function processC2D (s:string) {
        // process cloud commands
        if (!(s.isEmpty())) {
            const t0:string[] = s.split(":")
            if (t0.length == 1) {
                // received a generic command
                const t1:string[] = s.split("(")        //t1=cmd
                const t2:string[] = t1[1].split(")")    //t2=string of parameters
                const t3:string[] = t2[0].split(",")    //t3=array of parameters
                const cmd = convertToText(t1[0])
                const p1 = t3[0]
                const p2 = t3[1]
                const p3 = t3[2]
                s = "" // TODO waarom ??
                //basic.showString("" + cmd + (p1))
                invokeCommands(cmd, p1,p2,p3)
            }
            if (t0.length == 2) {
                if (parseFloat(t0[0]) == identity) {
                    // received a specific command for this device
                    const t1 = t0[1].split("(")
                    const t2 = t1[1].split(")")
                    const t3 = t2[0].split(",")
                    const cmd = convertToText(t1[0])
                    const p1 = t3[0]
                    const p2 = t3[1]
                    const p3 = t3[2]
                    s = "" //TODO: Waarom ??
                    invokeCommands(cmd, p1,p2,p3)
                }
            }
        }
    }

 
    function invokeCommands (cmd:string, p1:string, p2:string, p3:string) {
        if (true) { //TODO hier stond if doCommands .....
            // run this once and wait for new HandShake from Leaf Device
            // doCommands is set in radio.onReceivedString(function (receivedString))
            doCommands = false
            if (cmd == "sid") {
                setIdentity(parseFloat(p1), parseFloat(p2))
            } 
            else if (cmd == "who") {
                who()
            }
            else if (cmd == "clear") {
                clear()
            }
            else if (cmd == "rgb") {
                setRGB(parseFloat(p1), parseFloat(p2), parseFloat(p3))
            }
            else if (cmd == "color") {
                setColor(p1)
            }
            else if (cmd == "icon") {
                setIcon(p1)
            }
            else if (cmd == "reset") {
                setReset()
            }
            else if (cmd == "brightness") {
                setBrightness(parseFloat(p1))
            }
            else if (cmd == "servo") {
                setServo(parseFloat(p1))
            }
            else if (cmd == "digitalWrite") {
                setDigitalPin(parseFloat(p1), parseFloat(p2))
            }
            else if (cmd == "analogWrite") {
                setAnalogPin(parseFloat(p1), parseFloat(p2))
            } 
            else {
                setText(cmd,p1,p2,p3)
            } 
            //TODO reportedproperties = multiple parameters, first check this one.
            //addProperty(cmd, parseFloat(p1))
        }
    }

    function setAnalogPin (pin: number, value: number) {
        basic.showString("a")
        if (pin == 0) {
            pins.analogWritePin(AnalogPin.P0, value)
        }
        if (pin == 1) {
            pins.analogWritePin(AnalogPin.P1, value)
        }
        if (pin == 2) {
            pins.analogWritePin(AnalogPin.P2, value)
        }
    }

    function setDigitalPin (pin: number, value: number) {
        basic.showString("d")
        if (pin == 0) {
            pins.digitalWritePin(DigitalPin.P0, value)
        }
        if (pin == 1) {
            pins.digitalWritePin(DigitalPin.P1, value)
        }
        if (pin == 2) {
            pins.digitalWritePin(DigitalPin.P2, value)
        }
    }

    function setReset () {
        basic.showString("reset")
        control.reset()
    }

   function setIcon (name: string) {
        // show icon
        if (name == "heart") {
            basic.showIcon(IconNames.Heart)
        } else if (name == "happy") {
            basic.showIcon(IconNames.Happy)
        } else if (name == "cls") {
            basic.clearScreen()
        } else if (name == "sad") {
            basic.showIcon(IconNames.Sad)
        } else if (name == "random") {
            const iconnumber = randint(0, 2)
            basic.clearScreen()
            basic.pause(500)
            if (iconnumber == 0) {
                basic.showIcon(IconNames.Chessboard)
            } else if (iconnumber == 1) {
                basic.showIcon(IconNames.Square)
            } else if (iconnumber == 2) {
                basic.showIcon(IconNames.Scissors)
            }
        }
    }

    function setServo (value: number) {
        basic.showString("s")
        pins.servoWritePin(AnalogPin.P0, value)
        basic.pause(1000)
        basic.clearScreen()
    }

    function setRGB (r: number, g: number, b: number) {
        /*
        basic.showString("r")
        strip.showColor(neopixel.rgb(r, g, b))
        basic.pause(1000)
        basic.clearScreen()
        */
    }

    function setIdentity (i: number, v: number) {
        if (v == control.deviceSerialNumber()) {
            identity = i
            who()
        }
    }

    function setText (text: string,p1:string, p2:string,p3:string) {
        let s=text;
        if (p1!=undefined) {
            s=s+"("+p1
        }
        if (p2!=undefined) {
            s=s+","+p2
        }
        if (p3!=undefined) {
            s=s+","+p3
        }
        if (p1!=undefined) {
            s=s+")"
        }
        basic.showString(s)
    }

    function clear () {
        basic.clearScreen()
    }

    function setBrightness (value: number) {
        /*
        strip.setBrightness(value)
        strip.showRainbow(1, 360)
        strip.show()
        */
    }

    function who () {
        basic.showNumber(identity)
    }

    function setColor (color: string) {
        basic.showString("c")
        /*
        if (color == "red") {
            strip.showColor(neopixel.colors(NeoPixelColors.Red))
        } else if (color == "orange") {
            strip.showColor(neopixel.colors(NeoPixelColors.Orange))
        } else if (color == "yellow") {
            strip.showColor(neopixel.colors(NeoPixelColors.Yellow))
        } else if (color == "green") {
            strip.showColor(neopixel.colors(NeoPixelColors.Green))
        } else if (color == "blue") {
            strip.showColor(neopixel.colors(NeoPixelColors.Blue))
        } else if (color == "indigo") {
            strip.showColor(neopixel.colors(NeoPixelColors.Indigo))
        } else if (color == "violet") {
            strip.showColor(neopixel.colors(NeoPixelColors.Violet))
        } else if (color == "purple") {
            strip.showColor(neopixel.colors(NeoPixelColors.Purple))
        } else if (color == "white") {
            strip.showColor(neopixel.colors(NeoPixelColors.White))
        } else if (color == "black") {
            strip.showColor(neopixel.colors(NeoPixelColors.Black))
        } else if (color == "clear") {
            strip.clear()
        } else if (color == "rainbow") {
            strip.showRainbow(1, 360)
        }
        strip.show()
        //TODO reportedproperties = "\"" + color + "\""
        */
    }

    /////////////////////
    // End IoT Commands
    /////////////////////
}
