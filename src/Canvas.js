import React, { Component } from "react";

import CanvasDraw from "./RCD";
import uuid from 'uuid/v4'

import { API, graphqlOperation } from 'aws-amplify'
import { onUpdateCanvas } from './graphql/subscriptions'
import { updateCanvas, createCanvas } from './graphql/mutations'
import { getCanvas } from './graphql/queries'

const colors = [
  '#D50000',
  '#AA00FF',
  '#2962FF',
  '#18FFFF',
  '#00C853',
  '#FFD600',
  '#FF6D00',
  '#000000'
]

function rand() {
  return colors[~~(colors.length * Math.random())];
}

class Demo extends Component {
  state = {
    //brushColor: rand(),
    brushColor: '#2962FF',
    canvasHeight: 350,
    canvasWidth: 380,
    brushRadius: 4,
    lazyRadius: 8
  }
  lineLength = 0
  id = '123'
  clientId = uuid()
  canvasInfo = 'tempcanvas'

  componentDidMount() {
    console.log('componentDidMount ' + this.id);



    const canvas = {
      id: this.id,
      clientId: this.clientId,
      data: {
        ...this.state,
        lines: []
      }
    }
    console.log('canvas ' + canvas);

    // Create the canvas. If canvas is already created, retrieve the data & draw previous canvas
    /*
    API.graphql(graphqlOperation(createCanvas, { input: canvas }))
      .then(d => this.canvas.loadSaveData(d))
      .catch(err => {
        console.log('err ' + JSON.stringify(err.errors[0]));

      
    
    if (err.errors[0].data.id === this.id) {
      console.log('this.id '+this.id);
      const d = err.errors[0].data.data
      this.canvas.loadSaveData(d)
    }
    
  })
  this.canvas.loadSaveData(d)
  */
    API.graphql(graphqlOperation(getCanvas, { id: '123' }))
      .then(data => {
        //const d = data.data.getCanvas.data;
        this.canvas.loadSaveData(data.data.getCanvas.data)
      })
      .catch(err => {
        console.log('ERROR ' + JSON.stringify(err));

      })


    window.addEventListener('mouseup', (e) => {
      // If we are clicking on a button, do not update anything
      if (e.target.name === 'clearbutton') return
      this.setState({
        brushColor: rand()
      })



      const data = this.canvas.getSaveData()

      const p = JSON.parse(data)
      const length = p.lines.length
      this.lineLength = length

      const canvas = {
        id: this.id,
        clientId: this.clientId,
        data
      }


      // Save updated canvas in the database
      API.graphql(graphqlOperation(updateCanvas, { input: canvas }))
        .then(c => {
          console.log('canvas updated!')
        })
        .catch(err => console.log('error creating: ', err))
    })

  

    API.graphql(graphqlOperation(onUpdateCanvas))
      .subscribe({
        next: (d) => {
          console.log('SUBSCRIPTION '+d);
          const data = JSON.parse(d.value.data.onUpdateCanvas.data)
          const length = data.lines.length
          
          if (length === 0) {
            // If there is no canvas data, clear the canvas
            const data = this.canvas.getSaveData()
            const parsedData = JSON.parse(data)
            const newData = {
              ...parsedData,
              lines: []
            }
            console.log('newCanvas');
            const newCanvas = JSON.stringify(newData)
            this.canvas.loadSaveData(newCanvas)
            return
          }
          
          if (this.lineLength === length || length === Number(0)) return
          // Draw new lines to canvas
          console.log('drawing new lines');
          const last = data.lines[length - 1]
          this.canvas.simulateDrawingLines({ lines: [last] })
        }
      })
    





  }
  clear = () => {
    const data = this.canvas.getSaveData()
    const parsedData = JSON.parse(data)
    const newData = {
      ...parsedData,
      lines: []
    }
    const newCanvas = JSON.stringify(newData)
    this.canvas.loadSaveData(newCanvas)
    const canvas = {
      id: this.id,
      clientId: this.clientId,
      data: newCanvas
    }
    API.graphql(graphqlOperation(updateCanvas, { input: canvas }))
      .then(c => {
        console.log('canvas cleared!')
      })
      .catch(err => console.log('error creating: ', err))
  }
  render() {
    return (
      <div>
        <button name='clearbutton' onClick={this.clear}>Clear</button>
        <CanvasDraw
          {...this.state}
          ref={canvas => this.canvas = canvas}
        />
      </div>
    );
  }
}

export default Demo