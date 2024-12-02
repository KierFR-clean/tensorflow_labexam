import React, { useState } from 'react';
import { Container, Card, Form, Button, Table } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import * as tf from '@tensorflow/tfjs';
import Papa from 'papaparse';
import 'bootstrap/dist/css/bootstrap.min.css';

const ForecastCourses = () => {
    const [historicalData, setHistoricalData] = useState([]);  // store data doon sa csv
    const [maxStudents, setMaxStudents] = useState(30);// set sa 30
    const [predictions, setPredictions] = useState([]);// pangupdate nung predictions

    const importCSVFile = (event) => {
        const file = event.target.files[0];

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                const parsedData = results.data.map(row => ({
                    semester: row.semester || row.Semester,
                    courseCode: row.courseCode || row['Course Code'] || row.coursecode,
                    totalStudents: parseInt(row.totalStudents || row['Total Students'] || row.totalstudents)
                })).filter(row => !isNaN(row.totalStudents));

                setHistoricalData(parsedData);
            },
            error: function (error) {
                console.error('Error parsing CSV:', error);
                alert('Error parsing CSV file. Please check the format.');
            }
        });
    };
    //group the student num doon sa corresponding n of enrollees
    const preprocessData = (data) => {
        const courseGroups = {};
        data.forEach(entry => {
            if (!courseGroups[entry.courseCode]) {
                courseGroups[entry.courseCode] = [];
            }
            courseGroups[entry.courseCode].push(entry.totalStudents);
        });
        return courseGroups;
    };
    //isang data to predict then sgd and meansqurederror for optimizer and loss
    const trainModel = async () => {
        try {
            const processedData = preprocessData(historicalData);
            const predictions = [];

            for (const course in processedData) {
                const data = processedData[course];

                if (data.length === 0) continue;

                const model = tf.sequential({
                    layers: [
                        tf.layers.dense({ units: 1, inputShape: [1] })
                    ]
                });

                model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

                const xs = tf.tensor2d([...Array(data.length).keys()], [data.length, 1]);
                const ys = tf.tensor2d(data, [data.length, 1]);
                //adjust ung internal weight
                await model.fit(xs, ys, { epochs: 100 });
                // predict lang then extract na nakawhole number
                const prediction = model.predict(tf.tensor2d([data.length], [1, 1]));
                const predictedEnrollment = Math.max(0, Math.round(prediction.dataSync()[0]));

                predictions.push({
                    courseCode: course,
                    predictedEnrollment,
                    //formula nung calculated needed sections 
                    predictedSections: Math.ceil(predictedEnrollment / maxStudents)
                });
                //dispose lang 
                xs.dispose();
                ys.dispose();
                prediction.dispose();
                model.dispose();
            }

            setPredictions(predictions);
        } catch (error) {
            console.error(error);
            alert('Sa Csv file may error');
        }
    };

    return (
        <Container className="py-4">
            <Card className="mb-4">
                <Card.Header as="h5" className='bg-success text-white'>Course Section Forecasting</Card.Header>
                <Card.Body>
                    <Form className="mb-4">
                        <Form.Group className="mb-3">
                            <Form.Label>Import File (CSV)</Form.Label>
                            <Form.Control
                                type="file"
                                accept=".csv"
                                onChange={importCSVFile

                                }
                            />
                            <Form.Text className="text-muted">
                                Required a CSV file with columns "Semester", "Course Code", and "Total Students".
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Max Students per Section Only 30</Form.Label>
                            <Form.Control
                                type="number"
                                value={maxStudents}
                                onChange={(e) => setMaxStudents(parseInt(e.target.value))}
                                min="1"
                            />
                        </Form.Group>

                        <Button
                            variant="success  "
                            onClick={trainModel}
                            disabled={historicalData.length === 0}
                        >
                            Train Model & Predict Now
                        </Button>
                    </Form>

                    {predictions.length > 0 && (
                        <>
                            <h5 className="mb-3">Predicted Data</h5>
                            <Table striped bordered hover className="mb-4 w-100">
                                <thead>
                                    <tr>
                                        <th>Course Code</th>
                                        <th>Predicted Enrollment</th>
                                        <th>Predicted Sections</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {predictions.map((pred) => (
                                        <tr key={pred.courseCode}>
                                            <td>{pred.courseCode}</td>
                                            <td>{pred.predictedEnrollment}</td>
                                            <td>{pred.predictedSections}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            <h5 className="mb-3">Predicted Enrollment and Sections By Course</h5>
                            <div className="d-flex justify-content-center">
                                <BarChart width={1000} height={400} data={predictions}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="courseCode" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="predictedEnrollment" fill="#ABBA7C" name="Predicted Enrollment" />
                                    <Bar dataKey="predictedSections" fill="#FFE31A" name="Predicted Sections" />
                                </BarChart>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ForecastCourses;