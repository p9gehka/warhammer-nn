import * as fs from 'fs';
import * as tf from '@tensorflow/tfjs';
import {dirname, join, resolve} from 'path';

const writeFile = (...args) => new Promise((resolve) => fs.writeFile(...args, resolve));
const mkdir = (...args) => new Promise((resolve) => fs.mkdir(...args, resolve));

export class NodeFileSystem {
    MODEL_JSON_FILENAME = 'model.json';
    WEIGHTS_BINARY_FILENAME = 'weights.bin';
    constructor(path) {

      if (Array.isArray(path)) {
        tf.util.assert(
            path.length === 2,
            () => 'file paths must have a length of 2, ' +
                `(actual length is ${path.length}).`);
        this.path = path.map(p => resolve(p));
      } else {
        this.path = resolve(path);
      }
    }
    async createOrVerifyDirectory() {
      const paths = Array.isArray(this.path) ? this.path : [this.path];
      for (const path of paths) {
        try {
          await mkdir(path);
        } catch (e) {
          if (e.code === 'EEXIST') {
            if ((await stat(path)).isFile()) {
              throw new Error(
                  `Path ${path} exists as a file. The path must be ` +
                  `nonexistent or point to a directory.`);
            }
            // else continue, the directory exists
          } else {
            throw e;
          }
        }
      }
    }

    async save(modelArtifacts) {
      if (Array.isArray(this.path)) {
        throw new Error('Cannot perform saving to multiple paths.');
      }

      await this.createOrVerifyDirectory();

      if (modelArtifacts.modelTopology instanceof ArrayBuffer) {
        throw new Error(
            'NodeFileSystem.save() does not support saving model topology ' +
            'in binary format yet.');
        // TODO(cais, nkreeger): Implement this. See
        //   https://github.com/tensorflow/tfjs/issues/343
      } else {

        const weightsBinPath = join(this.path, this.WEIGHTS_BINARY_FILENAME);
        const weightsManifest = [{
          paths: [this.WEIGHTS_BINARY_FILENAME],
          weights: modelArtifacts.weightSpecs
        }];
        const modelJSON = {
          modelTopology: modelArtifacts.modelTopology,
          weightsManifest,
          format: modelArtifacts.format,
          generatedBy: modelArtifacts.generatedBy,
          convertedBy: modelArtifacts.convertedBy
        };
        if (modelArtifacts.trainingConfig != null) {
          modelJSON.trainingConfig = modelArtifacts.trainingConfig;
        }
        if (modelArtifacts.signature != null) {
          modelJSON.signature = modelArtifacts.signature;
        }
        if (modelArtifacts.userDefinedMetadata != null) {
          modelJSON.userDefinedMetadata = modelArtifacts.userDefinedMetadata;
        }
        const modelJSONPath = join(this.path, this.MODEL_JSON_FILENAME);
        writeFile(modelJSONPath, JSON.stringify(modelJSON), 'utf8');
        writeFile(
            weightsBinPath, Buffer.from(modelArtifacts.weightData), 'binary');

        return {
          // TODO(cais): Use explicit tf.io.ModelArtifactsInfo type below once it
          // is available.
          // tslint:disable-next-line:no-any
          modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(modelArtifacts),
        };
      }
    }
}
