//import { v4 as uuidv4 } from 'uuid';
import { GraphQLError } from 'graphql';
const pool = require('./db');
const { formatISO } = require('date-fns');

const EXECUTION_TIME = 60000;

type DBRow = {
    id: number;
    type: string;
    status: string;
    alpha: string | null;
    created_at: string;
};

const mockPythonExecution = () => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, EXECUTION_TIME);
    });
}

const resolvers = {
    Query: {
        predict: async (_: any, { modelId, x }: { modelId: string, x: number }, context: any) => {
            const query = 'SELECT * FROM models WHERE id = $1 AND user_id = $2';

            try {
                const result = await pool.query(query, [modelId, context.userId]);
                if (result.rowCount === 0) {
                    throw new GraphQLError("Model not found");
                }

                const model = result.rows[0];
                if (model.status !== "COMPLETED") {
                    throw new GraphQLError('Model not ready.');
                }

                return x + 1;
            } catch (error: any) {
                console.error("Error in making predictions:", error.message);
                throw error;
            }
        },

        modelStatus: async (_: any, { modelId }: { modelId: string }, context: any) => {
            const query = 'SELECT * FROM models WHERE id = $1 AND user_id = $2';

            try {
                const result = await pool.query(query, [modelId, context.userId]);
                if (result.rowCount === 0) {
                    throw new GraphQLError("Model not found");
                }

                const model = result.rows[0];
                if (model.status === "PENDING" && model.created_at) {
                    const elapsedTime = Date.now() - model.created_at;
                    const remainingTime = (EXECUTION_TIME - elapsedTime) / 1000;
                    return {
                        id: model.id,
                        type: model.type,
                        status: model.status,
                        alpha: model.alpha,
                        createTime: formatISO(new Date(model.created_at)),
                        waitTime: remainingTime > 0 ? remainingTime : 0
                    };
                }

                return {
                    id: model.id,
                    type: model.type,
                    status: model.status,
                    alpha: model.alpha,
                    createTime: formatISO(new Date(model.created_at)),
                    waitTime: 0
                };
            } catch (error: any) {
                console.error("Error in getting model status:", error.message);
                throw error;
            }
        },

        getAllModels: async (_: any, {}, context: any) => {
            const search_query = 'SELECT * FROM models WHERE user_id = $1';

            try {
                const { rows }: { rows: DBRow[] }  = await pool.query(search_query, [context.userId]);
                const models = rows.map(row => ({
                    id: row.id.toString(),           
                    type: row.type,                  
                    status: row.status,       
                    alpha: row.alpha,
                    createTime: formatISO(new Date(row.created_at))
                }));
                return models;
            } catch (error: any) {
                console.error("Error in getting all models:", error.message);
                throw error;
            }
        }
    },
    Mutation: {
        createModel: async (_: any, { data, modelType, alpha }: { data: Array<{ x: number, y: number }>, modelType: string, alpha?: number }, context: any) => {
            // Validation: Check if `alpha` is positive for Lasso and Ridge models
            if ((modelType === "LASSO" || modelType === "RIDGE") && alpha !== undefined && alpha <= 0) {
                throw new GraphQLError("The optional 'alpha' parameter must be a positive float for Lasso and Ridge models.");
            }
            
            const search_query = 'SELECT * FROM models WHERE user_id = $1';
            const insert_query = 'INSERT INTO models (type, status, alpha, user_id) VALUES ($1, $2, $3, $4) RETURNING *';
            let insert_result;

            try {
                // Check if the number of models reached five
                const search_result = await pool.query(search_query, [context.userId]);
                if (search_result.rowCount === 5) {
                    throw new GraphQLError("Reached the maximum number of created models");
                }

                const alphaValue = modelType !== "LINEAR" ? alpha : null;
                insert_result = await pool.query(insert_query, [modelType, "PENDING", alphaValue, context.userId]);
            } catch (error: any) {
                console.error("Error in creating model: ", error.message);
                throw error;
            }

            const model = insert_result.rows[0];
            model.createTime = formatISO(new Date(model.created_at));
            mockPythonExecution().then(async () => {
                try {
                    await pool.query("UPDATE models SET status = 'COMPLETED' WHERE id = $1", [model.id]);
                } catch (error: any) {
                    console.error("Error in updating model:", error.message);
                    throw error;
                }
            });

            return model; // Return immediately with `PENDING` status
        },

        deleteModel: async (_: any, { modelId }: { modelId: string }, context: any) => {
            const search_query = 'SELECT * FROM models WHERE id = $1 AND user_id = $2';
            const remove_query = 'DELETE FROM models WHERE id = $1 RETURNING *';

            try {
                const result = await pool.query(search_query, [modelId, context.userId]);
                if (result.rowCount === 0) {
                    throw new GraphQLError("Model not found");
                }
                
                /*
                // Check if the model to be deleted belong to the current user
                const model = result.rows[0];
                if (model.user_id !== context.userId) {
                    throw new GraphQLError("Model does not belong to the current user");
                }
                */

                const { rows } = await pool.query(remove_query, [modelId]);
                return rows[0];
            } catch (error: any) {
                console.error("Error in deleting model:", error.message);
                throw error;
            }
        }

    }
}

export default resolvers